import logging
from typing import List

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.schemas.questionnaire import QuestionnaireRequest, CampaignCreateRequest
from app.services.gemini_service import validate_questionnaire, recommend_channels
from app.services.storage_service import storage_service
from app.services.workflow import perform_research_workflow
from app.db.session import get_db
from app.db.models import Job, JobStatus, User, Client
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Validate questionnaire (public — no auth required so the form can check
# before the user is forced to log in)
# ---------------------------------------------------------------------------

@router.post("/validate", summary="Validate Questionnaire Input")
async def validate_submission(request: QuestionnaireRequest):
    """Validates the questionnaire data using Gemini AI."""
    result = validate_questionnaire(request)
    if not result.get("valid"):
        raise HTTPException(status_code=400, detail=result)
    return {
        "status": "valid",
        "message": "Questionnaire approved.",
        "feedback": result.get("feedback"),
    }


# ---------------------------------------------------------------------------
# Jobs (auth required)
# ---------------------------------------------------------------------------

@router.post("/jobs", summary="Create a New Campaign", status_code=status.HTTP_201_CREATED)
async def create_job(
    request: CampaignCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new campaign for an existing client.
    The client profile provides sections 1-4; only the campaign goal (objective + tone)
    is required here. Channels are recommended by AI.
    """
    # 1. Fetch and authorise the client
    client = db.query(Client).filter(Client.id == request.client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    if not current_user.is_admin and client.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised to create campaigns for this client")

    # 2. AI-recommended channels
    channels = recommend_channels(
        primary_objective=request.primary_objective,
        desired_tone_of_voice=request.desired_tone_of_voice,
        industry=client.industry,
        demographics=client.demographics,
        psychographics=client.psychographics,
    )

    # 3. Reconstruct the full questionnaire from client data + campaign goal
    questionnaire = QuestionnaireRequest(
        project_metadata={
            "brand_name": client.brand_name,
            "website_url": client.website_url,
            "target_country": client.target_country,
            "industry": client.industry,
        },
        product_definition={
            "product_description": client.product_description,
            "core_problem_solved": client.core_problem_solved,
            "unique_selling_proposition": client.unique_selling_proposition,
        },
        target_audience={
            "demographics": client.demographics,
            "psychographics": client.psychographics,
            "cultural_nuances": client.cultural_nuances,
        },
        market_context={
            "main_competitors": client.main_competitors,
            "current_marketing_efforts": client.current_marketing_efforts,
            "known_customer_objections": client.known_customer_objections,
        },
        the_creative_goal={
            "primary_objective": request.primary_objective,
            "desired_tone_of_voice": request.desired_tone_of_voice,
            "specific_channels": channels,
        },
    )

    # 4. Validate
    validation_result = validate_questionnaire(questionnaire)
    if not validation_result.get("valid"):
        raise HTTPException(status_code=400, detail=validation_result)

    # 5. Create Job in DB
    new_job = Job(
        status=JobStatus.APPROVED,
        project_metadata={
            "brand_name": client.brand_name,
            "industry": client.industry,
            "target_country": client.target_country,
            "primary_objective": request.primary_objective,
            "campaign_name": request.campaign_name,
            "campaign_description": request.campaign_description,
            "recommended_channels": channels,
        },
        user_id=current_user.id,
        client_id=client.id,
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # 6. Persist questionnaire snapshot to MinIO
    storage_key = f"jobs/{new_job.id}/questionnaire.json"
    success = storage_service.upload_json(storage_key, questionnaire.model_dump(mode="json"))
    if not success:
        logger.error(f"Failed to upload questionnaire artifact for job {new_job.id}")

    # 7. Trigger background research with the reconstructed questionnaire
    background_tasks.add_task(
        perform_research_workflow, str(new_job.id), questionnaire.model_dump(mode="json")
    )

    return {
        "job_id": str(new_job.id),
        "status": "submitted",
        "message": "Campaign accepted. Research started in background.",
        "validation_passed": True,
        "recommended_channels": channels,
    }


@router.get("/jobs", summary="List My Jobs")
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all jobs for the current user.
    Admins also see ALL jobs across all users.
    """
    if current_user.is_admin:
        jobs = db.query(Job).order_by(Job.created_at.desc()).all()
    else:
        jobs = (
            db.query(Job)
            .filter(Job.user_id == current_user.id)
            .order_by(Job.created_at.desc())
            .all()
        )

    return [
        {
            "job_id": str(j.id),
            "status": j.status,
            "brand_name": (j.project_metadata or {}).get("brand_name"),
            "industry": (j.project_metadata or {}).get("industry"),
            "target_country": (j.project_metadata or {}).get("target_country"),
            "primary_objective": (j.project_metadata or {}).get("primary_objective"),
            "campaign_name": (j.project_metadata or {}).get("campaign_name"),
            "campaign_description": (j.project_metadata or {}).get("campaign_description"),
            "recommended_channels": (j.project_metadata or {}).get("recommended_channels"),
            "client_id": str(j.client_id) if j.client_id else None,
            "created_at": j.created_at,
            "updated_at": j.updated_at,
            "failed_step": j.failed_step,
            "error_message": j.error_message,
            "owner_id": str(j.user_id) if j.user_id else None,
        }
        for j in jobs
    ]


@router.get("/jobs/{job_id}", summary="Get Job Status")
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the current status and metadata for a specific job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Non-admins can only see their own jobs
    if not current_user.is_admin and job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised to view this job")

    return {
        "job_id": job.id,
        "status": job.status,
        "created_at": job.created_at,
        "updated_at": job.updated_at,
        "brand_name": (job.project_metadata or {}).get("brand_name"),
        "campaign_name": (job.project_metadata or {}).get("campaign_name"),
        "campaign_description": (job.project_metadata or {}).get("campaign_description"),
        "recommended_channels": (job.project_metadata or {}).get("recommended_channels"),
        "client_id": str(job.client_id) if job.client_id else None,
        "failed_step": job.failed_step,
        "error_message": job.error_message,
        "owner_id": str(job.user_id) if job.user_id else None,
    }


@router.get("/jobs/{job_id}/questionnaire", summary="Get Job Questionnaire Input")
def get_job_questionnaire(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the original questionnaire data submitted for a job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not current_user.is_admin and job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised to view this job")

    storage_key = f"jobs/{job_id}/questionnaire.json"
    data = storage_service.get_json(storage_key)
    if not data:
        raise HTTPException(status_code=404, detail="Questionnaire data not found")
    return data


@router.get("/jobs/{job_id}/analysis", summary="Get Analysis Results")
def get_job_analysis(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves the generated analysis JSON (Hooks, Angles, etc.)"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not current_user.is_admin and job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised to view this job")

    analysis_key = f"jobs/{job_id}/analysis.json"
    data = storage_service.get_json(analysis_key)
    if not data:
        raise HTTPException(status_code=404, detail="Analysis content not found")
    return data


@router.get("/jobs/{job_id}/download", summary="Download Presentation")
def download_presentation(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Downloads the generated PowerPoint presentation for a completed job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not current_user.is_admin and job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised to download this job")

    pptx_key = f"jobs/{job_id}/presentation.pptx"
    file_stream = storage_service.get_file_stream(pptx_key)
    if not file_stream:
        raise HTTPException(
            status_code=404, detail="Presentation not found (or job is not complete)"
        )

    return StreamingResponse(
        file_stream,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={
            "Content-Disposition": f'attachment; filename="marketing_strategy_{job_id}.pptx"'
        },
    )
