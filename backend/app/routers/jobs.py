from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


def _job_with_count(job: models.Job, db: Session) -> schemas.JobOut:
    count = db.query(func.count(models.Application.id)).filter(
        models.Application.job_id == job.id
    ).scalar()
    out = schemas.JobOut.model_validate(job)
    out.application_count = count
    return out


# ---------- Public endpoints (candidates) ----------

@router.get("", response_model=List[schemas.JobOut])
def list_open_jobs(db: Session = Depends(get_db)):
    """Public: list all currently open jobs. No authentication required."""
    jobs = (
        db.query(models.Job)
        .filter(models.Job.status == models.JobStatus.open)
        .order_by(models.Job.created_at.desc())
        .all()
    )
    return [_job_with_count(j, db) for j in jobs]


@router.get("/{job_id}", response_model=schemas.JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Public: view a single job's details."""
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_with_count(job, db)


# ---------- Recruiter-only endpoints ----------

@router.get("/recruiter/mine", response_model=List[schemas.JobOut])
def list_my_jobs(
    db: Session = Depends(get_db),
    current_recruiter: models.User = Depends(auth.get_current_recruiter),
):
    """Recruiter: list all jobs (open and closed) that they created."""
    jobs = (
        db.query(models.Job)
        .filter(models.Job.recruiter_id == current_recruiter.id)
        .order_by(models.Job.created_at.desc())
        .all()
    )
    return [_job_with_count(j, db) for j in jobs]


@router.post("", response_model=schemas.JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_recruiter: models.User = Depends(auth.get_current_recruiter),
):
    """Recruiter: create a new job posting."""
    job = models.Job(
        title=payload.title,
        description=payload.description,
        location=payload.location,
        employment_type=payload.employment_type,
        recruiter_id=current_recruiter.id,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return _job_with_count(job, db)


def _get_owned_job(job_id: int, current_recruiter: models.User, db: Session) -> models.Job:
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != current_recruiter.id:
        raise HTTPException(status_code=403, detail="You do not have access to this job")
    return job


@router.put("/{job_id}", response_model=schemas.JobOut)
def update_job(
    job_id: int,
    payload: schemas.JobUpdate,
    db: Session = Depends(get_db),
    current_recruiter: models.User = Depends(auth.get_current_recruiter),
):
    """Recruiter: edit a job they own."""
    job = _get_owned_job(job_id, current_recruiter, db)
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
    db.commit()
    db.refresh(job)
    return _job_with_count(job, db)


@router.patch("/{job_id}/close", response_model=schemas.JobOut)
def close_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_recruiter: models.User = Depends(auth.get_current_recruiter),
):
    """Recruiter: close a job so it no longer accepts applications."""
    job = _get_owned_job(job_id, current_recruiter, db)
    job.status = models.JobStatus.closed
    db.commit()
    db.refresh(job)
    return _job_with_count(job, db)


@router.patch("/{job_id}/reopen", response_model=schemas.JobOut)
def reopen_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_recruiter: models.User = Depends(auth.get_current_recruiter),
):
    """Recruiter: reopen a previously closed job."""
    job = _get_owned_job(job_id, current_recruiter, db)
    job.status = models.JobStatus.open
    db.commit()
    db.refresh(job)
    return _job_with_count(job, db)
