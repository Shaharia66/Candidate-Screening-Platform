# HireBoard — Candidate Screening Platform

A full-stack web application that lets recruiters post and manage jobs, and lets candidates browse open roles, apply, and track their application status — built as a Python full-stack developer assessment.

**Stack:** FastAPI (Python) · React (Vite) · MySQL · Render · Netlify · Aiven

## 🌐 Live Demo

| | |
|---|---|
| **Frontend (live app)** | https://candidate-screening-platform.netlify.app |
| **Backend API** | https://candidate-screening-platform-tosb.onrender.com |
| **API Docs (Swagger)** | https://candidate-screening-platform-tosb.onrender.com/docs |

📘 **See [USER_GUIDE.md](./USER_GUIDE.md)** for step-by-step instructions on using the platform as a recruiter or as a candidate.

> **Note:** the backend runs on Render's free tier, which spins down after inactivity. The first request after idle time may take up to ~50 seconds to respond while it wakes up — subsequent requests are fast.

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
┌──────────────┐        HTTPS (JSON)       ┌──────────────┐        SQL (SSL)      ┌───────────────┐
│    React     │ ─────────────────────────▶│   FastAPI    │ ──────────────────────▶│  MySQL (Aiven) │
│  (Netlify)   │◀───────────────────────── │   (Render)   │◀────────────────────── │                │
└──────────────┘       JWT in header        └──────────────┘                        └───────────────┘
```

- **Frontend** is deployed to **Netlify** as a static site built with Vite. It talks to the backend over HTTPS using the `VITE_API_URL` environment variable.
- **Backend** is deployed to **Render** as a Docker-based Web Service, built directly from `backend/Dockerfile`. SQLAlchemy ORM models map to MySQL tables. Recruiter authentication uses JWT bearer tokens (passwords hashed with bcrypt).
- **Database** is a managed **MySQL instance on Aiven** (free tier), which enforces SSL-only connections — the backend uses a CA certificate (`backend/ca.pem`) to connect securely.

Each piece is a separate deployed service — there's no shared network between them, so all communication happens over public HTTPS URLs configured via environment variables.

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

## 4. Running Locally (Docker)

While the live version runs on Render/Netlify/Aiven, the project also runs fully locally via Docker for development/testing.

**Prerequisites:** Docker and Docker Compose installed.

```bash
cp .env.example .env
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

To stop:
```bash
docker-compose down          # stop containers
docker-compose down -v       # stop and wipe the local database volume
```

### Running without Docker (backend + frontend separately)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
export DB_HOST=localhost DB_USER=root DB_PASSWORD=yourpassword DB_NAME=screening_platform
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 5. API Reference

Full interactive docs: https://candidate-screening-platform-tosb.onrender.com/docs

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

- **Candidates don't have accounts.** The brief only requires candidates to apply, submit a resume URL, and track status — not manage a profile. Candidates are identified only by the email they apply with, and track status via an email lookup.
- **Resume is a URL, not a file upload**, exactly as specified in the assessment brief.
- **JWT auth for recruiters only.** Recruiter actions are sensitive and gated behind login; candidate actions are intentionally frictionless.
- **Duplicate applications are blocked** — the same email can't apply to the same job twice.
- **A closed job stops accepting new applications** (enforced server-side, not just hidden in the UI).
- **Ownership checks:** a recruiter can only edit/close/review jobs and applications they created (returns `403` otherwise).
- **SSL-secured database connection.** Aiven's managed MySQL enforces SSL-only connections; the backend loads a CA certificate (`backend/ca.pem`) via the `DB_SSL_CA` environment variable to connect securely — see `backend/app/database.py`.

---

## 7. What I'd Add With More Time

- Automated tests (pytest for backend, React Testing Library for frontend)
- Alembic migrations instead of `create_all()`
- Real resume file upload with S3-compatible storage, as an alternative to URLs
- Pagination and search/filtering on the jobs and applications lists
- Email notifications when application status changes
- Rate limiting on public endpoints (application submission, login)
- Tighten CORS to the exact frontend origin instead of `*`
- A custom domain instead of the default Render/Netlify subdomains

---

## 8. Project Structure

```
candidate-screening-platform/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, startup, CORS
│   │   ├── database.py        # SQLAlchemy engine/session (SSL-aware)
│   │   ├── models.py          # ORM models (User, Job, Application)
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # JWT + password hashing
│   │   ├── config.py          # Environment-based settings
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── jobs.py
│   │       └── applications.py
│   ├── ca.pem                 # Aiven MySQL CA certificate (SSL)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/              # One component per route
│   │   ├── components/         # Layouts, shared UI (status tags, guards)
│   │   ├── context/             # AuthContext (JWT/session state)
│   │   ├── api/client.js       # Axios instance with auth interceptor
│   │   ├── App.jsx             # Route definitions
│   │   └── index.css           # Design tokens + global styles
│   ├── public/_redirects       # Netlify SPA routing fallback
│   ├── nginx.conf              # Used only for local Docker builds
│   └── Dockerfile
├── docker-compose.yml           # Local development only
├── netlify.toml                 # Netlify build configuration
├── USER_GUIDE.md                 # How to use the platform (recruiter & candidate)
├── .env.example
└── README.md
```

---

## 9. Deployment (how the live version is actually hosted)

| Piece | Platform | Notes |
|---|---|---|
| Database | **Aiven** (MySQL, free tier) | SSL-required connection via `ca.pem` |
| Backend | **Render** (free Web Service, Docker) | Builds from `backend/Dockerfile`; auto-restarts on push to `master` |
| Frontend | **Netlify** (free static site) | Builds from `frontend/` via `netlify.toml`; `VITE_API_URL` points to the Render backend |

To redeploy after code changes, just push to GitHub — both Render and Netlify auto-deploy on push to `master`.