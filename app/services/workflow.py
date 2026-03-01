import asyncio
import logging
import os
import tempfile
import traceback

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Job, JobStatus
from app.db.session import SessionLocal
from app.schemas.questionnaire import QuestionnaireRequest
from app.services.consensus_service import consensus_service
from app.services.gemini_research_service import gemini_research_service
from app.services.multi_analysis_service import multi_analysis_service
from app.services.presentation_service import presentation_service
from app.services.research_consolidator import research_consolidator
from app.services.research_service import research_service
from app.services.storage_service import storage_service

logger = logging.getLogger(__name__)


def _fail_job(db: Session, job_id: str, step: str, error: Exception) -> None:
    """Mark a job as failed with diagnostic info."""
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = JobStatus.FAILED
            job.failed_step = step
            job.error_message = str(error)[:1000]  # Truncate very long messages
            db.commit()
    except Exception:
        logger.exception(f"[Job {job_id}] Could not update failed status in DB")


async def perform_research_workflow(job_id: str, request_data: dict):
    """
    Background task to run deep research and persist results.
    A new DB session is created here since it runs outside the request lifecycle.
    """
    db: Session = SessionLocal()
    step = "init"
    try:
        logger.info(f"[Job {job_id}] Starting Research Workflow")

        # 1. Update status to RESEARCHING
        step = "status_update"
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            logger.error(f"[Job {job_id}] Job not found in DB — aborting")
            return

        job.status = JobStatus.RESEARCHING
        db.commit()

        # 2. Run Dual Research in parallel with timeout
        # Perplexity is optional — if its key is expired or it's unreachable,
        # the job continues in degraded mode using Gemini research only.
        step = "dual_research"
        questionnaire = QuestionnaireRequest(**request_data)
        logger.info(f"[Job {job_id}] Starting Dual Research (Perplexity + Gemini)")

        async def safe_perplexity():
            try:
                return await research_service.conduct_deep_research(questionnaire)
            except Exception as e:
                logger.warning(f"[Job {job_id}] Perplexity research failed, continuing without it: {e}")
                return {}

        perplexity_results, gemini_results = await asyncio.wait_for(
            asyncio.gather(
                safe_perplexity(),
                gemini_research_service.conduct_creative_research(questionnaire),
            ),
            timeout=settings.RESEARCH_TIMEOUT,
        )

        if not perplexity_results:
            logger.warning(f"[Job {job_id}] Running in Gemini-only research mode")

        # 3. Consolidate Research
        step = "consolidation"
        logger.info(f"[Job {job_id}] Consolidating Research")
        consolidated_research = research_consolidator.consolidate_research(perplexity_results, gemini_results)

        # 4. Persist Research artifacts
        step = "persist_research"
        storage_service.upload_json(f"jobs/{job_id}/research_perplexity.json", perplexity_results)
        storage_service.upload_json(f"jobs/{job_id}/research_gemini.json", gemini_results)
        storage_service.upload_json(f"jobs/{job_id}/research_consolidated.json", consolidated_research)
        logger.info(f"[Job {job_id}] Research artifacts saved")

        # 5. Run Triple Analysis in parallel with timeout
        step = "triple_analysis"
        logger.info(f"[Job {job_id}] Starting Triple Analysis (GPT-4o, Gemini, Perplexity)")
        job.status = JobStatus.ANALYZING
        db.commit()

        triple_analysis_results = await asyncio.wait_for(
            multi_analysis_service.run_triple_analysis(request_data, consolidated_research),
            timeout=settings.ANALYSIS_TIMEOUT,
        )
        storage_service.upload_json(f"jobs/{job_id}/analysis_raw_triple.json", triple_analysis_results)

        # 6. Generate Consensus
        step = "consensus"
        logger.info(f"[Job {job_id}] Generating Consensus")
        consensus_result = consensus_service.generate_consensus(triple_analysis_results)
        storage_service.upload_json(f"jobs/{job_id}/analysis.json", consensus_result)
        logger.info(f"[Job {job_id}] Consensus saved")

        # 7. Structure Slides
        step = "slide_structure"
        logger.info(f"[Job {job_id}] Structuring Slides")
        slide_structure = presentation_service.structure_content(request_data, consensus_result)
        storage_service.upload_json(f"jobs/{job_id}/slides.json", slide_structure)

        # 8. Generate PPTX using a safe temp file
        step = "pptx_generation"
        logger.info(f"[Job {job_id}] Generating PowerPoint")
        with tempfile.NamedTemporaryFile(suffix=".pptx", delete=False) as tmp:
            temp_pptx = tmp.name

        try:
            generated_path = presentation_service.generate_pptx(slide_structure, temp_pptx, questionnaire=request_data)
            if generated_path:
                pptx_key = f"jobs/{job_id}/presentation.pptx"
                storage_service.upload_file(
                    pptx_key,
                    generated_path,
                    content_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                )
                logger.info(f"[Job {job_id}] PPTX saved to {pptx_key}")
            else:
                raise RuntimeError("presentation_service.generate_pptx returned None")
        finally:
            if os.path.exists(temp_pptx):
                os.remove(temp_pptx)

        # 9. Done
        step = "complete"
        job.status = JobStatus.COMPLETED
        db.commit()
        logger.info(f"[Job {job_id}] Workflow complete")

    except asyncio.TimeoutError as e:
        logger.error(f"[Job {job_id}] Timeout at step '{step}': {e}")
        _fail_job(db, job_id, step, e)
    except Exception as e:
        logger.error(f"[Job {job_id}] Workflow failed at step '{step}': {e}")
        traceback.print_exc()
        _fail_job(db, job_id, step, e)
    finally:
        db.close()
