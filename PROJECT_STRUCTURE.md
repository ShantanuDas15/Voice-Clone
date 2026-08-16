# 🏗️ Voice Clone — Project Architecture & Folder Structure

This document outlines the complete file and folder structure for the **Voice Clone** project, engineered from the ground up to support the required ML/AI capabilities while adhering to free-tier cloud deployment constraints (Railway/Render, Vercel, Supabase/Neon, Cloudflare R2, and Redis Cloud).

---

## 📂 Root Repository Structure (Monorepo)

The repository follows a monorepo approach, isolating the frontend client from the backend API and worker processes to simplify CI/CD.

```text
voice_clone/
├── .github/
│   └── workflows/              # GitHub Actions for CI (linting/testing) and CD (auto-deploy)
├── frontend/                   # React 18 + Vite Web Application
├── backend/                    # FastAPI + Celery ML Application
├── docker-compose.yml          # Local development stack (Postgres, Redis, FastAPI, Celery)
├── .env.example                # Template for environment variables
├── .gitignore                  # Global git ignores (node_modules, .venv, secrets, cache)
├── GEMINI.md                   # Agent development protocols & rules
├── PROJECT_STRUCTURE.md        # This file
└── voice_cloning_project_spec.md # Project specification and requirements
```

---

## 🖥️ Frontend Structure (`frontend/`)
**Tech Stack**: React 18, Vite, TypeScript, React Router v6, Zustand, Tailwind CSS, shadcn/ui.
**Deployment Target**: Vercel (Free Tier).

```text
frontend/
├── public/                     # Static assets directly served (favicon, manifest, robots.txt)
├── src/
│   ├── assets/                 # Images, icons, and global CSS
│   │   └── index.css           # Global Tailwind and shadcn/ui styles
│   ├── components/
│   │   ├── ui/                 # Reusable, generic UI components (shadcn/ui generated: Button, Input, Modal)
│   │   ├── layout/             # Structural components (Navbar, Footer, Sidebar, PrivateRoute wrapper)
│   │   └── features/           # Domain-specific components (AudioPlayer/WaveSurfer, VoiceUploadForm)
│   ├── hooks/                  # Custom React hooks (e.g., useAuth, useAudioPlayback)
│   ├── lib/                    # Core integrations and utilities
│   │   ├── axios.ts            # Axios HTTP client with Firebase JWT interceptors
│   │   ├── firebase.ts         # Firebase JS SDK initialization and auth helpers
│   │   └── utils.ts            # Utility functions (Tailwind class merging, formatting)
│   ├── pages/                  # Page-level route components
│   │   ├── Landing.tsx         # /
│   │   ├── Login.tsx           # /login
│   │   ├── Dashboard.tsx       # /dashboard (Voice Library)
│   │   ├── VoiceCreate.tsx     # /voices/new
│   │   ├── VoiceDetail.tsx     # /voices/:id (Generate speech, history)
│   │   └── Profile.tsx         # /profile
│   ├── store/                  # Zustand global state management
│   │   ├── authStore.ts        # User session and JWT state
│   │   └── generationStore.ts  # Polling state for async TTS generation
│   ├── types/                  # Global TypeScript interfaces and Zod schemas
│   ├── App.tsx                 # Root React component containing React Router v6 definitions
│   └── main.tsx                # Application entry point and React DOM rendering
├── .env.local                  # Local frontend secrets (Firebase API keys, Backend URL)
├── index.html                  # Vite HTML entry point
├── package.json                # NPM dependencies and scripts
├── tailwind.config.js          # Tailwind CSS styling and theme configuration
├── tsconfig.json               # TypeScript compiler options
└── vite.config.ts              # Vite bundler configuration
```

---

## ⚙️ Backend Structure (`backend/`)
**Tech Stack**: FastAPI, Python 3.11, SQLAlchemy 2.0, Alembic, Celery, Redis, PyTorch, Coqui XTTS v2.
**Deployment Target**: Railway or Render (Free/Hobby Tier CPU instances for API + Worker).

```text
backend/
├── alembic/                    # Database migration environment
│   ├── versions/               # Generated migration scripts (SQLAlchemy)
│   └── env.py                  # Alembic setup for reading SQLAlchemy metadata
├── app/
│   ├── api/                    # API Route Handlers (Controllers)
│   │   ├── dependencies.py     # FastAPI Dependency Injection (get_db, verify_firebase_token)
│   │   ├── routes/
│   │   │   ├── auth.py         # Authentication callbacks/verifications
│   │   │   ├── voices.py       # CRUD for Voice Profiles
│   │   │   └── generation.py   # Submitting TTS tasks, checking task status
│   │   └── router.py           # Main API router aggregating all sub-routes
│   ├── core/                   # Application-wide configurations
│   │   ├── config.py           # Pydantic BaseSettings for ENV variables (DB_URL, REDIS_URL, R2_KEYS)
│   │   ├── security.py         # Firebase Admin SDK logic for JWT verification
│   │   └── exceptions.py       # Custom HTTP exception handlers
│   ├── db/                     # Database Engine Configuration
│   │   ├── database.py         # SQLAlchemy async engine, sessionmaker setup
│   │   └── base.py             # SQLAlchemy declarative base (for Alembic mapping)
│   ├── models/                 # SQLAlchemy ORM Models (Database Tables)
│   │   ├── user.py             # users table
│   │   ├── voice_profile.py    # voice_profiles table
│   │   └── generation.py       # generation_history table
│   ├── schemas/                # Pydantic Models (Data Validation, API Requests/Responses)
│   │   ├── user_schema.py
│   │   ├── voice_schema.py
│   │   └── generation_schema.py
│   ├── services/               # Core Business Logic
│   │   ├── storage_service.py  # Boto3 logic for Cloudflare R2 / AWS S3 uploads/downloads
│   │   └── ml_service.py       # Interfaces for Librosa preprocessing before sending to Celery
│   ├── tasks/                  # Asynchronous Background Processing (Celery)
│   │   ├── celery_app.py       # Celery application initialization (connected to Redis)
│   │   └── ml_tasks.py         # Heavy ML worker functions (Coqui XTTS v2 embedding + synthesis)
│   └── main.py                 # FastAPI application instance and middleware setup
├── alembic.ini                 # Alembic configuration file
├── requirements.txt            # Python dependencies (managed via uv/pip)
├── Dockerfile.api              # Container image for serving the FastAPI Uvicorn web server
└── Dockerfile.worker           # Container image for running the Celery ML worker process
```

---

## 🏗️ Architecture & Cloud Deployment Strategy

### 1. The Separation of API & ML Workers
Because voice cloning is computationally expensive (10–60 seconds on a CPU), the FastAPI web server **must never** perform ML inference synchronously. 
* **`Dockerfile.api`**: Runs `uvicorn app.main:app`. It purely handles HTTP requests, DB CRUD, and enqueues TTS jobs to Redis.
* **`Dockerfile.worker`**: Runs `celery -A app.tasks.celery_app worker`. It listens to Redis, downloads the reference audio/embeddings from Cloudflare R2, executes PyTorch/Coqui TTS inference, uploads the resulting `.wav` to R2, and updates the database status.

### 2. Free-Tier Cloud Optimization
* **Database (Supabase / Neon)**: Connects via standard Postgres `psycopg2`/`asyncpg` connection strings.
* **Message Broker (Redis Cloud)**: Provides the Celery backend required for task queueing without managing an internal Redis container in production.
* **Storage (Cloudflare R2)**: Essential to avoid AWS S3 egress bandwidth costs when streaming generated `.wav` files to the frontend.
* **Compute (Railway / Render)**: Two separate services will be deployed from the `backend/` directory: one Web service (using `Dockerfile.api`) and one Worker service (using `Dockerfile.worker`). 

### 3. Local Development (`docker-compose.yml`)
To mirror the cloud architecture locally without polluting the host machine, the `docker-compose.yml` will spin up:
1. `postgres` (Local DB)
2. `redis` (Local Broker)
3. `api` (FastAPI Server with hot-reloading)
4. `worker` (Celery worker process for ML execution)
