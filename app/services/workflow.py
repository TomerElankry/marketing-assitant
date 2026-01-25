from sqlalchemy.orm import Session
from app.db.models import Job, JobStatus
from app.schemas.questionnaire import QuestionnaireRequest
from app.services.research_service import research_service
from app.services.gemini_research_service import gemini_research_service
from app.services.research_consolidator import research_consolidator
from app.services.storage_service import storage_service
from app.services.multi_analysis_service import multi_analysis_service
from app.services.consensus_service import consensus_service
from app.services.presentation_service import presentation_service
from app.db.session import SessionLocal
import traceback
import os
import asyncio

async def perform_research_workflow(job_id: str, request_data: dict):
    """
    Background task to run deep research and persist results.
    We create a new DB session here since it's running in the background.
    """
    db: Session = SessionLocal()
    try:
        print(f"[Job {job_id}] Starting Research Workflow...")
        
        # 1. Update Status to RESEARCHING
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            print(f"[Job {job_id}] Job not found in DB!")
            return
            
        job.status = JobStatus.RESEARCHING
        db.commit()
        
        # 2. Run Dual Research (Perplexity + Gemini)
        questionnaire = QuestionnaireRequest(**request_data)
        print(f"[Job {job_id}] Starting Dual Research (Perplexity + Gemini)...")
        
        # Run both research agents in parallel
        perplexity_results, gemini_results = await asyncio.gather(
            research_service.conduct_deep_research(questionnaire),
            gemini_research_service.conduct_creative_research(questionnaire)
        )
        
        # 3. Consolidate Research
        print(f"[Job {job_id}] Consolidating Research...")
        consolidated_research = research_consolidator.consolidate_research(perplexity_results, gemini_results)
        
        # 4. Persist Research to Storage
        storage_service.upload_json(f"jobs/{job_id}/research_perplexity.json", perplexity_results)
        storage_service.upload_json(f"jobs/{job_id}/research_gemini.json", gemini_results)
        storage_service.upload_json(f"jobs/{job_id}/research_consolidated.json", consolidated_research)
        print(f"[Job {job_id}] Research saved.")

        # 5. Run Triple Analysis (GPT-4o, Gemini, Perplexity)
        print(f"[Job {job_id}] Starting Triple Analysis (GPT-4o, Gemini, Perplexity)...")
        job.status = JobStatus.ANALYZING
        db.commit()

        # Run 3 models in parallel
        triple_analysis_results = await multi_analysis_service.run_triple_analysis(request_data, consolidated_research)
        storage_service.upload_json(f"jobs/{job_id}/analysis_raw_triple.json", triple_analysis_results)
        
        # 6. Generate Consensus
        print(f"[Job {job_id}] Generating Consensus...")
        consensus_result = consensus_service.generate_consensus(triple_analysis_results)
        
        # 7. Persist Consensus to Storage (as the main analysis result)
        analysis_key = f"jobs/{job_id}/analysis.json"
        storage_service.upload_json(analysis_key, consensus_result)
        print(f"[Job {job_id}] Consensus Analysis saved to {analysis_key}")
        
        # 8. Structure Slides (using Consensus data)
        print(f"[Job {job_id}] Structuring Slides...")
        slide_structure = presentation_service.structure_content(request_data, consensus_result)
        
        structure_key = f"jobs/{job_id}/slides.json"
        storage_service.upload_json(structure_key, slide_structure)
        
        # 9. Generate PPTX
        print(f"[Job {job_id}] Generating PowerPoint...")
        temp_pptx = f"/tmp/{job_id}.pptx"
        generated_path = presentation_service.generate_pptx(slide_structure, temp_pptx)
        
        if generated_path:
            pptx_key = f"jobs/{job_id}/presentation.pptx"
            storage_service.upload_file(pptx_key, generated_path, content_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
            print(f"[Job {job_id}] PPTX saved to {pptx_key}")
            
            # Clean up
            os.remove(generated_path)
        else:
            print(f"[Job {job_id}] PPTX Generation Failed")

        # 10. Workflow Complete
        job.status = JobStatus.COMPLETED 
        db.commit()
        
        print(f"[Job {job_id}] Workflow Complete.")

    except Exception as e:
        print(f"[Job {job_id}] Workflow FAILED: {e}")
        traceback.print_exc()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.status = JobStatus.FAILED
                db.commit()
        except:
            pass
    finally:
        db.close()
