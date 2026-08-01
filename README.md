# HireBoard — Candidate Screening Platform

A full-stack web application that lets recruiters post and manage jobs, and lets candidates browse open roles, apply, and track their application status — built as a Python full-stack developer assessment.

**Stack:** FastAPI (Python) · React (Vite) · MySQL 8 · Docker & Docker Compose

---

## 1. Features

### Recruiter (authenticated via JWT)
- Register / log in to a recruiter account
- Create job postings
- View all jobs they've posted, with live application counts
- Edit job details
- Close (and reopen) a job
- Review all applications submitted to a job
- Update a candidate's application status (`applied → shortlisted → interview → hired / rejected`)

### Candidate (no account required)
- Browse all currently **open** jobs
- View full job details
- Apply with name, email, and a **resume URL** (link to Google Drive, Dropbox, portfolio, etc. — no file upload, per assessment scope)
- Track the status of their applications at any time by looking them up with their email

---

## 2. Architecture

```
┌────────────┐        HTTP (JSON)        ┌────────────┐        SQL         ┌───────────┐
│   React    │ ─────────────────────────▶│  FastAPI   │ ───────────────────▶│  MySQL 8  │
│  (Vite +   │◀───────────────────────── │  (REST API)│◀───────────────────│           │
│  nginx)    │       JWT in header        └────────────┘                     └───────────┘
└────────────┘
```

- **Frontend** is a single-page React app (React Router for navigation), built with Vite and served via nginx in production. nginx also reverse-proxies `/api/*` requests to the backend container, so the browser only ever talks to one origin.
- **Backend** is a FastAPI REST API. SQLAlchemy ORM models map to MySQL tables. Recruiter authentication uses JWT bearer tokens (passwords hashed with bcrypt).
- **Database** is MySQL 8, running in its own container with a persistent volume.

All three services are orchestrated with Docker Compose — one command starts the whole stack.

---

## 3. Database Schema

**users** (recruiters only — candidates do not have accounts)
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| name | VARCHAR(120) | |
| email | VARCHAR(180) | unique |
| hashed_password | VARCHAR(255) | bcrypt hash |
| role | ENUM | currently only `recruiter` |
| created_at | DATETIME | |

**jobs**
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| title | VARCHAR(200) | |
| description | TEXT | |
| location | VARCHAR(150) | nullable |
| employment_type | VARCHAR(50) | nullable |
| status | ENUM | `open` / `closed` |
| recruiter_id | INT, FK → users.id | |
| created_at / updated_at | DATETIME | |

**applications**
| Column | Type | Notes |
|---|---|---|
| id | INT, PK | |
| job_id | INT, FK → jobs.id | |
| candidate_name | VARCHAR(120) | |
| candidate_email | VARCHAR(180) | indexed — used for status tracking |
| resume_url | VARCHAR(500) | |
| status | ENUM | `applied` / `shortlisted` / `interview` / `rejected` / `hired` |
| applied_at / updated_at | DATETIME | |

Relationships: one recruiter → many jobs; one job → many applications. A candidate cannot apply to the same job twice with the same email (enforced at the application layer).

Tables are created automatically on backend startup via `SQLAlchemy.metadata.create_all()` — no manual migration step needed for this assessment scope.

---

## 4. Getting Started (Docker — recommended)

**Prerequisites:** Docker and Docker Compose installed. Nothing else.

```bash
# 1. Clone/unzip the project, then from the project root:
cp .env.example .env

# 2. Build and start everything
docker-compose up --build
```

Once containers are up:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Interactive API docs (Swagger UI):** http://localhost:8000/docs

The backend automatically retries its database connection on startup, so it's fine that MySQL takes a few seconds longer to become ready.

To stop everything:
```bash
docker-compose down          # stop containers
docker-compose down -v       # stop and wipe the database volume
```

### Running without Docker (optional, for local development)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# point at a local MySQL instance via environment variables, e.g.:
export DB_HOST=localhost DB_USER=root DB_PASSWORD=yourpassword DB_NAME=screening_platform

uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # runs on http://localhost:5173, proxies API calls to VITE_API_URL if set
```

---

## 5. API Reference

Full interactive docs are auto-generated at `/docs` (Swagger) and `/redoc`. Summary below.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new recruiter |
| POST | `/api/auth/login` | — | Log in, returns JWT |
| GET | `/api/auth/me` | Recruiter | Get current recruiter profile |

### Jobs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs` | — | List all **open** jobs (public) |
| GET | `/api/jobs/{id}` | — | Get one job's details (public) |
| GET | `/api/jobs/recruiter/mine` | Recruiter | List jobs owned by the logged-in recruiter |
| POST | `/api/jobs` | Recruiter | Create a job |
| PUT | `/api/jobs/{id}` | Recruiter | Edit a job (must be owner) |
| PATCH | `/api/jobs/{id}/close` | Recruiter | Close a job |
| PATCH | `/api/jobs/{id}/reopen` | Recruiter | Reopen a closed job |

### Applications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/jobs/{id}/applications` | — | Candidate applies to a job |
| GET | `/api/applications/track?email=` | — | Candidate looks up their applications |
| GET | `/api/jobs/{id}/applications` | Recruiter | List applications for a job (must be owner) |
| PATCH | `/api/applications/{id}/status` | Recruiter | Update a candidate's status |

Recruiter-only endpoints require an `Authorization: Bearer <token>` header, obtained from `/api/auth/login` or `/api/auth/register`.

---

## 6. Key Design Decisions & Assumptions

- **Candidates don't have accounts.** The brief only requires candidates to apply, submit a resume URL, and track status — not manage a profile. Requiring signup would add friction real job boards try to avoid, so candidates are identified only by the email they apply with, and track status via an email lookup. This is called out explicitly since it's a deliberate scope decision, not an oversight.
- **Resume is a URL, not a file upload**, exactly as specified in the assessment brief — this avoids needing file storage infrastructure (e.g. S3) within the time box.
- **JWT auth for recruiters only.** Recruiter actions (creating/editing/closing jobs, changing application status) are sensitive and gated behind login; candidate actions are intentionally frictionless.
- **Duplicate applications are blocked** — the same email can't apply to the same job twice.
- **A closed job stops accepting new applications** (enforced server-side, not just hidden in the UI).
- **Ownership checks:** a recruiter can only edit/close/review jobs and applications they created (returns `403` otherwise).

---

## 7. What I'd Add With More Time

- Automated tests (pytest for backend, React Testing Library for frontend)
- Alembic migrations instead of `create_all()`
- Real resume file upload with S3-compatible storage, as an alternative to URLs
- Pagination and search/filtering on the jobs and applications lists
- Email notifications when application status changes
- Rate limiting on public endpoints (application submission, login)
- Role-based access if candidate accounts were added later

---

## 8. Project Structure

```
candidate-screening-platform/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, startup, CORS
│   │   ├── database.py        # SQLAlchemy engine/session
│   │   ├── models.py          # ORM models (User, Job, Application)
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # JWT + password hashing
│   │   ├── config.py          # Environment-based settings
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── jobs.py
│   │       └── applications.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/               # One component per route
│   │   ├── components/          # Layouts, shared UI (status tags, guards)
│   │   ├── context/              # AuthContext (JWT/session state)
│   │   ├── api/client.js        # Axios instance with auth interceptor
│   │   ├── App.jsx              # Route definitions
│   │   └── index.css            # Design tokens + global styles
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 9. Deploying for Free (optional)

- **Frontend:** deploy the `frontend/` folder to **Vercel** or **Netlify** (both free, permanent).
- **Backend + MySQL:** deploy the repo to **Railway**, which can build directly from `docker-compose.yml` — runs on free trial credits, sufficient to demo this project.
- Set `VITE_API_URL` in the frontend's environment to point at the deployed backend URL, and update backend `CORS` origins accordingly.
