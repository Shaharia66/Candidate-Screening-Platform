import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.database import Base, engine
from app.routers import auth, jobs, applications

app = FastAPI(
    title="Candidate Screening Platform API",
    description="API for recruiters to manage jobs/applications and for candidates to apply and track status.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # simplified for assessment purposes; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def wait_for_db_and_create_tables(retries: int = 10, delay: int = 3):
    """
    MySQL inside Docker can take a few seconds to accept connections after
    the container starts. Retry table creation instead of failing immediately.
    """
    for attempt in range(retries):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError:
            time.sleep(delay)
    raise RuntimeError("Could not connect to the database after multiple retries.")


@app.on_event("startup")
def on_startup():
    wait_for_db_and_create_tables()


app.include_router(auth.router)
app.include_router(jobs.router)
app.include_router(applications.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
