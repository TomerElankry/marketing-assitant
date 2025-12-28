from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.schemas.questionnaire import QuestionnaireRequest
from app.services.gemini_service import validate_questionnaire
from app.services.storage_service import storage_service
from app.services.workflow import perform_research_workflow
from app.db.session import SessionLocal, get_db
from app.db.models import Job, JobStatus

router = APIRouter()

@router.post("/validate", summary="Validate Questionnaire Input")
async def validate_submission(request: QuestionnaireRequest):
    """
    Validates the questionnaire data using Gemini AI.
    Returns 200 if valid, 400 with feedback if invalid.
    """
    result = validate_questionnaire(request)
    
    if not result.get("valid"):
        # We return 400 Bad Request so the frontend knows to stop and show feedback
        raise HTTPException(status_code=400, detail=result)
    
    return {
        "status": "valid",
        "message": "Questionnaire approved.",
        "feedback": result.get("feedback")
    }

@router.post("/jobs", summary="Submit a New Job", status_code=status.HTTP_201_CREATED)
async def create_job(
    request: QuestionnaireRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Submits a new job. 
    1. Validates the questionnaire.
    2. Creates a Job record in Postgres.
    3. Saves the questionnaire JSON to MinIO/S3.
    4. Triggers background research.
    """
    # 1. Validate
    validation_result = validate_questionnaire(request)
    if not validation_result.get("valid"):
        raise HTTPException(status_code=400, detail=validation_result)

    # 2. Create Job in DB
    brand_name = request.project_metadata.brand_name
    
    new_job = Job(
        status=JobStatus.APPROVED,
        project_metadata={"brand_name": brand_name}
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    
    # 3. Persist to Storage
    storage_key = f"jobs/{new_job.id}/questionnaire.json"
    success = storage_service.upload_json(storage_key, request.model_dump(mode='json'))
    
    if not success:
        print(f"CRITICAL: Failed to upload artifact for job {new_job.id}")

    # 4. Trigger Background Research
    # We pass the raw dict to avoid sharing Pydantic objects across async boundaries if not needed,
    # but passing the dict is safer for serialization.
    background_tasks.add_task(perform_research_workflow, str(new_job.id), request.model_dump(mode='json'))
        
    return {
        "job_id": str(new_job.id),
        "status": "submitted",
        "message": "Job accepted. Research started in background.",
        "validation_passed": True
    }

@router.get("/jobs/{job_id}/download", summary="Download Presentation")
def download_presentation(job_id: str, db: Session = Depends(get_db)):
    """
    Downloads the generated PowerPoint presentation for a completed job.
    """
    # 1. Check if Job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # 2. Check if file exists in Storage
    pptx_key = f"jobs/{job_id}/presentation.pptx"
    file_stream = storage_service.get_file_stream(pptx_key)
    
    if not file_stream:
        raise HTTPException(status_code=404, detail="Presentation not found (or job is not complete)")

    # 3. Return Streaming Response
    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="marketing_strategy_{job_id}.pptx"'}
    )
