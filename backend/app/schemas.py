from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator

from app.models import JobStatus, ApplicationStatus


# ---------- Auth / Recruiter ----------

class RecruiterCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long")
        return v


class RecruiterLogin(BaseModel):
    email: EmailStr
    password: str


class RecruiterOut(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    recruiter: RecruiterOut


# ---------- Jobs ----------

class JobCreate(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    employment_type: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None


class JobOut(BaseModel):
    id: int
    title: str
    description: str
    location: Optional[str]
    employment_type: Optional[str]
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    application_count: Optional[int] = 0

    class Config:
        from_attributes = True


# ---------- Applications ----------

class ApplicationCreate(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    resume_url: str

    @field_validator("resume_url")
    @classmethod
    def resume_url_must_look_valid(cls, v):
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("resume_url must be a valid URL starting with http:// or https://")
        return v


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    candidate_name: str
    candidate_email: EmailStr
    resume_url: str
    status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationWithJobOut(ApplicationOut):
    job_title: str
