from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api", tags=["Applications"])


# ---------- Candidate endpoints (public) ----------

@router.post(
    "/jobs/{job_id}/applications",
    response_model=schemas.ApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_job(job_id: int, payload: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    """Public: a candidate applies to an open job with their resume URL."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != models.JobStatus.open:
        raise HTTPException(status_code=400, detail="This job is closed and no longer accepting applications")

    duplicate = (
        db.query(models.Application)
        .filter(
            models.Application.job_id == job_id,
            models.Application.candidate_email == payload.candidate_email,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="You have already applied to this job with this email")

    application = models.Application(
        job_id=job_id,
        candidate_name=payload.candidate_name,
        candidate_email=payload.candidate_email,
        resume_url=payload.resume_url,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/applications/track", response_model=List[schemas.ApplicationWithJobOut])
def track_my_applications(email: str, db: Session = Depends(get_db)):
    """Public: a candidate looks up all their applications by email."""
    applications = (
        db.query(models.Application)
        .filter(models.Application.candidate_email == email)
        .order_by(models.Application.applied_at.desc())
        .all()
    )
    results = []
    for app_ in applications:
        data = schemas.ApplicationOut.model_validate(app_).model_dump()
        data["job_title"] = app_.job.title
        results.append(schemas.ApplicationWithJobOut(**data))
    return results


# ---------- Recruiter endpoints ----------

@router.get("/jobs/{job_id}/applications", response_model=List[schemas.ApplicationOut])
def list_applications_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_recruiter: models.User = Depends(auth.get_current_recruiter),
):
    """Recruiter: review all applications submitted for a job they own."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != current_recruiter.id:
        raise HTTPException(status_code=403, detail="You do not have access to this job")

    return (
        db.query(models.Application)
        .filter(models.Application.job_id == job_id)
        .order_by(models.Application.applied_at.desc())
        .all()
    )


@router.patch("/applications/{application_id}/status", response_model=schemas.ApplicationOut)
def update_application_status(
    application_id: int,
    payload: schemas.ApplicationStatusUpdate,
    db: Session = Depends(get_db),
    current_recruiter: models.User = Depends(auth.get_current_recruiter),
):
    """Recruiter: update a candidate's application status (shortlist, reject, hire, etc.)."""
    application = (
        db.query(models.Application)
        .filter(models.Application.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.job.recruiter_id != current_recruiter.id:
        raise HTTPException(status_code=403, detail="You do not have access to this application")

    application.status = payload.status
    db.commit()
    db.refresh(application)
    return application
