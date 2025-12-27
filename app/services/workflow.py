from sqlalchemy.orm import Session
from app.db.models import Job, JobStatus
from app.schemas.questionnaire import QuestionnaireRequest
from app.services.research_service import research_service
from app.services.storage_service import storage_service
from app.services.analysis_service import analysis_service
from app.services.presentation_service import presentation_service
from app.db.session import SessionLocal
import traceback
import os

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
        
        # 2. Run Research (Perplexity)
        questionnaire = QuestionnaireRequest(**request_data)
        research_results = await research_service.conduct_deep_research(questionnaire)
        
        # 3. Persist Research to Storage
        research_key = f"jobs/{job_id}/research.json"
        storage_service.upload_json(research_key, research_results)
        print(f"[Job {job_id}] Research saved to {research_key}")

        # 4. Run Analysis (GPT-4o)
        print(f"[Job {job_id}] Starting Analysis (GPT-4o)...")
        job.status = JobStatus.ANALYZING
        db.commit()

        analysis_result = analysis_service.analyze_research(request_data, research_results)
        
        # 5. Persist Analysis to Storage
        analysis_key = f"jobs/{job_id}/analysis.json"
        storage_service.upload_json(analysis_key, analysis_result)
        print(f"[Job {job_id}] Analysis saved to {analysis_key}")
        
        # 6. Structure Slides (GPT-4o)
        print(f"[Job {job_id}] Structuring Slides...")
        slide_structure = presentation_service.structure_content(request_data, analysis_result)
        
        structure_key = f"jobs/{job_id}/slides.json"
        storage_service.upload_json(structure_key, slide_structure)
        
        # 7. Generate PPTX
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

        # 8. Workflow Complete
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
