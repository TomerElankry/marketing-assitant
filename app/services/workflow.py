from sqlalchemy.orm import Session
from app.db.models import Job, JobStatus
from app.schemas.questionnaire import QuestionnaireRequest
from app.services.research_service import research_service
from app.services.storage_service import storage_service
from app.db.session import SessionLocal
import traceback

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
        # Convert dict back to Pydantic model for the service
        questionnaire = QuestionnaireRequest(**request_data)
        research_results = await research_service.conduct_deep_research(questionnaire)
        
        # 3. Persist Results to Storage
        storage_key = f"jobs/{job_id}/research.json"
        storage_service.upload_json(storage_key, research_results)
        print(f"[Job {job_id}] Research saved to {storage_key}")
        
        # 4. Update Status to RESEARCH_COMPLETED (Or ready for next step)
        # For now, we leave it as RESEARCH_COMPLETED or simply trigger the next step.
        # Since 'RESEARCH_COMPLETED' isn't in our initial Enum, I'll leave it as 'RESEARCHING' 
        # or I should add a waiting state. 
        # Let's assume 'ANALYZING' is the next step, so we can set it to that 
        # or add a specific 'RESEARCH_DONE' state. 
        # For this MVP, let's mark it 'RESEARCH_DONE' to indicate this phase is over.
        # Wait, I need to check my Enum. 
        # Enum: PENDING, APPROVED, RESEARCHING, ANALYZING, COMPLETED, FAILED.
        # I'll set it to 'ANALYZING' to assume it's ready for the next agent, 
        # OR I will add 'RESEARCH_COMPLETED' to the enum if needed. 
        # For now, let's just use 'ANALYZING' as a placeholder for "Research Done, waiting for Analysis".
        job.status = JobStatus.ANALYZING
        db.commit()
        
        print(f"[Job {job_id}] Workflow Step 1 (Research) Complete.")

    except Exception as e:
        print(f"[Job {job_id}] Workflow FAILED: {e}")
        traceback.print_exc()
        # Update status to FAILED
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.status = JobStatus.FAILED
                db.commit()
        except:
            pass
    finally:
        db.close()
