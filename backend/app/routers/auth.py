from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register_recruiter(payload: schemas.RecruiterCreate, db: Session = Depends(get_db)):
    """Register a new recruiter account."""
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    recruiter = models.User(
        name=payload.name,
        email=payload.email,
        hashed_password=auth.hash_password(payload.password),
        role=models.UserRole.recruiter,
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)

    token = auth.create_access_token({"sub": str(recruiter.id)})
    return schemas.Token(access_token=token, recruiter=recruiter)


@router.post("/login", response_model=schemas.Token)
def login_recruiter(payload: schemas.RecruiterLogin, db: Session = Depends(get_db)):
    """Authenticate a recruiter and issue a JWT access token."""
    recruiter = db.query(models.User).filter(models.User.email == payload.email).first()
    if not recruiter or not auth.verify_password(payload.password, recruiter.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth.create_access_token({"sub": str(recruiter.id)})
    return schemas.Token(access_token=token, recruiter=recruiter)


@router.get("/me", response_model=schemas.RecruiterOut)
def get_me(current_recruiter: models.User = Depends(auth.get_current_recruiter)):
    """Return the currently logged-in recruiter's profile."""
    return current_recruiter
