# 📋 Voice Clone — Phase 1 Development Plan
### Foundation · Monorepo · Auth · API Skeleton · Database · Frontend Scaffold

**Phase**: 1 of 4  
**Timeline**: Week 1–2  
**Python Runtime**: `3.11.15` (managed via `uv`, venv at `backend/.venv`)  
**Status**: 🟡 In Progress

---

## Current Project State (Baseline)

| Asset | Status |
|-------|--------|
| `voice_cloning_project_spec.md` | ✅ Complete |
| `PROJECT_STRUCTURE.md` | ✅ Complete |
| `DATABASE_DESIGN.md` | ✅ Complete |
| `GEMINI.md` — Agent rules | ✅ Active |
| `.gitignore` | ✅ Complete |
| `backend/.venv` (Python 3.11.15) | ✅ Provisioned via `uv` |
| Git Repository — first commit | ❌ Not yet pushed |
| GitHub Remote | ❌ Not yet configured |
| `frontend/` scaffold | ❌ Not created |
| `backend/` application code | ❌ Not created |
| `docker-compose.yml` | ❌ Not created |

---

## Phase 1 Objectives

By the end of Phase 1, the project must have:

1. A fully initialized monorepo committed to GitHub.
2. A working local development environment via Docker Compose (PostgreSQL + Redis + FastAPI + Celery).
3. A FastAPI backend skeleton with Firebase JWT authentication middleware and all database models created via Alembic.
4. A React + Vite + TypeScript frontend scaffold with full authentication flows (Email/Password + Google OAuth) and protected routing.
5. A deployed "skeleton" — backend on Railway (or Render), frontend on Vercel — accessible via a public URL.

---

## Milestone Overview

| # | Milestone | Description | Status |
|---|-----------|-------------|--------|
| 1.1 | Monorepo & Git Init | Initialize Git, GitHub remote, folder scaffold, first commit | ✅ Done |
| 1.2 | Docker Compose Local Dev | PostgreSQL + Redis containers for local development | ✅ Done |
| 1.3 | Backend Skeleton (FastAPI) | FastAPI app, config, database engine, health endpoint | ✅ Done |
| 1.4 | Database Models & Migrations | SQLAlchemy models from `DATABASE_DESIGN.md` + Alembic | ✅ Done |
| 1.5 | Firebase Auth Middleware | Firebase Admin SDK JWT verification in FastAPI | 🟡 Pending User Setup |
| 1.6 | Core API Endpoints (Auth) | User sync and profile endpoints (POST /auth/sync, GET /users/me) | ✅ Done |
| 1.7 | Frontend Scaffold (React+Vite) | Vite app with TypeScript, Tailwind CSS, shadcn/ui, routing | ✅ Done |
| 1.8 | Frontend Auth Flows | Login, Signup, Google OAuth, protected route, profile page | ✅ Done |
| 1.9 | CI/CD & Deployment | GitHub Actions CI, Railway backend deploy, Vercel frontend deploy | ❌ Todo |

---

## Milestone 1.1 — Monorepo & Git Initialization

### Goal
Initialize the project as a clean Git monorepo, create the agreed folder skeleton from `PROJECT_STRUCTURE.md`, configure the GitHub remote, and push the foundation as the first commit.

### Files & Folders to Create

```
voice_clone/
├── .github/
│   └── workflows/
│       └── ci.yml                  # [NEW] GitHub Actions CI placeholder
├── frontend/                       # [SCAFFOLD] Empty placeholder with .gitkeep
├── backend/
│   ├── .venv/                      # [EXISTS] Python 3.11 venv (gitignored)
│   └── .python-version             # [NEW] Pin Python version for uv/pyenv
├── .env.example                    # [NEW] Template for all required env vars
├── .gitignore                      # [EXISTS]
├── GEMINI.md                       # [EXISTS]
├── PROJECT_STRUCTURE.md            # [EXISTS]
├── DATABASE_DESIGN.md              # [EXISTS]
└── voice_cloning_project_spec.md   # [EXISTS]
```

### Tasks
- [x] Create `backend/.python-version` with content `3.11.15`
- [x] Create `frontend/.gitkeep` placeholder
- [x] Create `.github/workflows/ci.yml` stub
- [x] Create `.env.example` with all required variable keys (no values)
- [x] Initialize GitHub remote (`git remote add origin <url>`)
- [x] Initial commit: `chore: Initialize Voice Clone monorepo scaffold`

### Verification Gateway
```bash
git status               # Should show clean working tree after commit
git log --oneline        # Should show 1 commit
git remote -v            # Should show GitHub remote origin
```

---

## Milestone 1.2 — Docker Compose Local Development Environment

### Goal
Create a `docker-compose.yml` that spins up a fully isolated local dev environment matching the production cloud topology: PostgreSQL, Redis, and optionally the FastAPI server and Celery worker in hot-reload mode.

### Files to Create

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Multi-service local dev stack |
| `backend/Dockerfile.api` | FastAPI server container (dev + prod) |
| `backend/Dockerfile.worker` | Celery ML worker container (dev + prod) |
| `.env` (local, gitignored) | Actual secrets populated from `.env.example` |

### Services Defined in `docker-compose.yml`

| Service | Image | Exposed Port | Notes |
|---------|-------|-------------|-------|
| `postgres` | `postgres:16-alpine` | `5432` | Health-checked; data persisted in named volume |
| `redis` | `redis:7-alpine` | `6379` | Used as Celery broker + result backend |
| `api` | `./backend/Dockerfile.api` | `8000` | Mounts backend source for hot-reload with `--reload` |
| `worker` | `./backend/Dockerfile.worker` | — | Celery worker, shares same source mount |

### Tasks
- [x] Write `docker-compose.yml` with all 4 services
- [x] Write `backend/Dockerfile.api` (Python 3.11 + uvicorn)
- [x] Write `backend/Dockerfile.worker` (Python 3.11 + celery)
- [x] Add named volume for Postgres data persistence
- [x] Add health checks for `postgres` and `redis` services

### Verification Gateway
```bash
docker compose up -d postgres redis
docker compose ps              # postgres and redis should be "healthy"
docker compose exec postgres psql -U voiceclone -c "\l"  # DB accessible
docker compose down
```

---

## Milestone 1.3 — Backend Skeleton (FastAPI Application)

### Goal
Create the complete FastAPI application structure with proper configuration management, async database engine setup, and a working `/health` endpoint. No business logic yet — foundation only.

### Python Dependencies (Backend)

**Core Framework:**
```
fastapi==0.115.x
uvicorn[standard]==0.30.x
gunicorn==22.x
```

**Configuration & Validation:**
```
pydantic==2.x
pydantic-settings==2.x
python-dotenv==1.x
```

**Database:**
```
sqlalchemy==2.0.x
asyncpg==0.29.x          # Async PostgreSQL driver
alembic==1.13.x
psycopg2-binary==2.9.x   # For Alembic sync operations
```

**Task Queue:**
```
celery==5.4.x
redis==5.x
flower==2.x              # Celery monitoring dashboard (dev only)
```

**Authentication:**
```
firebase-admin==6.x
```

**Cloud Storage:**
```
boto3==1.34.x            # Cloudflare R2 (S3-compatible)
```

**Utilities:**
```
python-multipart==0.0.x  # FastAPI file upload support
httpx==0.27.x            # Async HTTP client (for tests)
```

### Files to Create

| File | Purpose |
|------|---------|
| `backend/requirements.txt` | Pinned Python dependency list |
| `backend/app/__init__.py` | Package marker |
| `backend/app/main.py` | FastAPI app instance, CORS, middleware, router inclusion |
| `backend/app/core/__init__.py` | Package marker |
| `backend/app/core/config.py` | `pydantic-settings` BaseSettings — reads from env vars |
| `backend/app/core/exceptions.py` | Custom HTTP exception handlers |
| `backend/app/db/__init__.py` | Package marker |
| `backend/app/db/database.py` | Async SQLAlchemy engine + sessionmaker + `get_db` dependency |
| `backend/app/db/base.py` | SQLAlchemy declarative base (imported by all models) |
| `backend/app/api/__init__.py` | Package marker |
| `backend/app/api/router.py` | Main APIRouter aggregating all sub-routes |
| `backend/app/api/routes/__init__.py` | Package marker |
| `backend/app/api/routes/health.py` | `GET /health` — returns 200 + DB connectivity status |

### Tasks
- [x] Create `backend/requirements.txt` with all pinned dependencies
- [x] Install dependencies: `uv pip install -r backend/requirements.txt`
- [x] Create `app/core/config.py` with `Settings` class (DATABASE_URL, REDIS_URL, etc.)
- [x] Create `app/db/database.py` with async engine and `get_db` dependency
- [x] Create `app/main.py` with CORS, exception handlers, router registration
- [x] Create `GET /health` endpoint that pings the database
- [x] Verify FastAPI app starts without errors

### Verification Gateway
```bash
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# In a separate terminal:
curl http://localhost:8000/health
# Expected: {"status": "ok", "database": "connected"}

curl http://localhost:8000/docs
# Expected: Swagger UI accessible
```

---

## Milestone 1.4 — Database Models & Alembic Migrations

### Goal
Implement all 5 SQLAlchemy ORM models from `DATABASE_DESIGN.md`, initialize Alembic, and generate + run the baseline migration that creates all tables, indexes, enum types, and the `updated_at` trigger.

### Files to Create

| File | Purpose |
|------|---------|
| `backend/app/models/__init__.py` | Package marker |
| `backend/app/models/user.py` | `User` SQLAlchemy model |
| `backend/app/models/voice_profile.py` | `VoiceProfile` SQLAlchemy model |
| `backend/app/models/voice_audio_sample.py` | `VoiceAudioSample` SQLAlchemy model |
| `backend/app/models/generation.py` | `GenerationHistory` SQLAlchemy model |
| `backend/app/models/usage_stats.py` | `UserUsageStats` SQLAlchemy model |
| `backend/alembic.ini` | Alembic root config |
| `backend/alembic/env.py` | Migration environment (uses async engine) |
| `backend/alembic/versions/001_initial_schema.py` | Baseline migration (auto-generated then reviewed) |

### Tasks
- [x] Create all 5 SQLAlchemy model files matching `DATABASE_DESIGN.md` DDL
- [x] Initialize Alembic: `alembic init alembic`
- [x] Configure `alembic/env.py` to use the async engine and import all models
- [x] Generate baseline migration: `alembic revision --autogenerate -m "001_initial_schema"`
- [x] Review generated migration for correctness (enums, triggers, partial indexes)
- [x] Apply migration to local Postgres: `alembic upgrade head`
- [x] Verify all tables and indexes exist in the database

### Verification Gateway
```bash
# With Docker Compose postgres running:
alembic upgrade head

# Connect to DB and verify:
docker compose exec postgres psql -U voiceclone -c "\dt"
# Expected: users, voice_profiles, voice_audio_samples, generation_history, user_usage_stats

docker compose exec postgres psql -U voiceclone -c "\di"
# Expected: All indexes present (idx_users_firebase_uid, etc.)

alembic current
# Expected: Shows head revision hash
```

---

## Milestone 1.5 — Firebase Authentication Middleware

### Goal
Integrate Firebase Admin SDK into FastAPI as a reusable dependency. Every protected API endpoint will use `Depends(verify_firebase_token)` to validate the Bearer JWT from the client.

### Files to Create / Modify

| File | Purpose |
|------|---------|
| `backend/app/core/security.py` | Firebase Admin SDK init + `verify_firebase_token()` FastAPI dependency |
| `backend/app/api/dependencies.py` | `get_db` + `get_current_user` combined FastAPI dependency |

### Environment Variables Required (`.env`)

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/path/to/serviceAccountKey.json
# OR base64-encoded JSON string for production:
FIREBASE_SERVICE_ACCOUNT_KEY_B64=<base64_encoded_json>
```

### Tasks
- [ ] Create Firebase project in Firebase Console (free Spark plan)
- [ ] Enable Email/Password and Google sign-in providers
- [ ] Download Firebase service account key JSON (gitignored)
- [x] Implement `verify_firebase_token()` — decodes & validates Firebase JWT
- [x] Implement `get_current_user()` — fetches or creates `User` record in DB after token verification
- [x] Apply `Depends(get_current_user)` to a test-protected endpoint (`/users/me`)

### Verification Gateway
```bash
# Unit test — mock Firebase token validation
pytest backend/tests/test_auth.py -v

# Integration test — use Firebase REST API to get a real test token:
# POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword
# Then: curl -H "Authorization: Bearer <token>" http://localhost:8000/users/me
# Expected: 200 with user data OR 401 if token is invalid/expired
```

---

## Milestone 1.6 — Core Auth API Endpoints

### Goal
Implement the two foundational API endpoints that power the auth flow: a user sync endpoint (called after every Firebase login to ensure the DB record is up to date) and a profile fetch endpoint.

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/sync` | 🔒 Required | Upsert user from Firebase token → DB. Creates `UserUsageStats` record on first sync. |
| `GET` | `/api/v1/users/me` | 🔒 Required | Return current user's profile + usage stats. |

### Files to Create / Modify

| File | Purpose |
|------|---------|
| `backend/app/schemas/__init__.py` | Package marker |
| `backend/app/schemas/user_schema.py` | `UserCreate`, `UserResponse` Pydantic models |
| `backend/app/services/__init__.py` | Package marker |
| `backend/app/services/user_service.py` | DB business logic for user upsert and fetch |
| `backend/app/api/routes/auth.py` | `POST /auth/sync` route handler |
| `backend/app/api/routes/users.py` | `GET /users/me` route handler |

### Tasks
- [x] Create Pydantic schemas for `UserResponse`
- [x] Implement `user_service.upsert_user()` — async upsert on `firebase_uid`
- [x] Implement `user_service.get_user_with_stats()` — joined fetch
- [x] Create route handlers with proper dependency injection
- [x] Register routes in `app/api/router.py` under `/api/v1` prefix
- [x] Write unit tests for service functions

### Verification Gateway
```bash
pytest backend/tests/test_user_routes.py -v
# All tests must pass

# Integration check (with real Firebase token):
curl -X POST http://localhost:8000/api/v1/auth/sync \
  -H "Authorization: Bearer <firebase_id_token>"
# Expected: 200 {"id": "...", "email": "...", "firebase_uid": "..."}

curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer <firebase_id_token>"
# Expected: 200 with full user + usage_stats
```

---

## Milestone 1.7 — Frontend Scaffold (React + Vite + TypeScript)

### Goal
Bootstrap the React application using Vite with TypeScript, integrate Tailwind CSS and shadcn/ui for the component system, configure Firebase JS SDK for client-side auth, and set up React Router v6 with the full application route structure.

### Node.js Tooling Requirements

```bash
node >= 20.x
npm >= 10.x
```

### Frontend NPM Dependencies

**Core:**
```
react@18.x
react-dom@18.x
typescript@5.x
vite@5.x
```

**Routing & State:**
```
react-router-dom@6.x
zustand@4.x
```

**UI & Styling:**
```
tailwindcss@3.x
@shadcn/ui (CLI-generated components)
class-variance-authority
clsx
tailwind-merge
lucide-react         # Icon library
```

**Auth & HTTP:**
```
firebase@10.x
axios@1.x
```

**Forms & Validation:**
```
react-hook-form@7.x
zod@3.x
@hookform/resolvers
```

**Audio:**
```
wavesurfer.js@7.x
```

### Files to Create

| File | Purpose |
|------|---------|
| `frontend/vite.config.ts` | Vite + React plugin config, path aliases (`@/`) |
| `frontend/tsconfig.json` | TypeScript strict mode config |
| `frontend/tailwind.config.js` | Tailwind + shadcn/ui theme tokens |
| `frontend/src/main.tsx` | React app entry point |
| `frontend/src/App.tsx` | Root component with React Router `<Routes>` |
| `frontend/src/lib/firebase.ts` | Firebase JS SDK initialization |
| `frontend/src/lib/axios.ts` | Axios instance with Firebase JWT interceptor |
| `frontend/src/store/authStore.ts` | Zustand auth state (user, loading, token) |
| `frontend/src/components/layout/PrivateRoute.tsx` | HOC: redirects to `/login` if unauthenticated |
| `frontend/index.html` | Vite HTML entry point |
| `frontend/package.json` | NPM manifest |

### Tasks
- [x] Scaffold: `npm create vite@latest frontend -- --template react-ts`
- [x] Install all dependencies listed above
- [x] Configure Tailwind CSS + shadcn/ui init
- [x] Create `lib/firebase.ts` (reads `VITE_FIREBASE_*` env vars)
- [x] Create `lib/axios.ts` with auto-injecting Firebase JWT interceptor
- [x] Create Zustand `authStore` with `onAuthStateChanged` listener
- [x] Create `<PrivateRoute>` component
- [x] Configure all routes in `App.tsx`
- [x] Verify `npm run dev` starts without TypeScript or Vite errors

### Verification Gateway
```bash
cd frontend && npm run dev
# Expected: Vite dev server starts on http://localhost:5173 with no errors

npm run build
# Expected: TypeScript compilation completes with 0 errors

# Navigate to http://localhost:5173
# Expected: App renders (blank pages are fine — auth not wired yet)
```

---

## Milestone 1.8 — Frontend Authentication Flows

### Goal
Implement all auth-related pages and connect them to Firebase Authentication. After login/signup, the app must call `POST /api/v1/auth/sync` to ensure the user record exists in the database.

### Pages to Create

| Page Component | Route | Description |
|----------------|-------|-------------|
| `pages/Landing.tsx` | `/` | Hero section, CTA buttons to `/login` and `/signup` |
| `pages/Login.tsx` | `/login` | Email/Password login + Google OAuth button |
| `pages/Signup.tsx` | `/signup` | Email/Password registration + Google OAuth button |
| `pages/Dashboard.tsx` | `/dashboard` | Protected placeholder — "Voice Library coming in Phase 2" |
| `pages/Profile.tsx` | `/profile` | Protected page showing user email, display name, usage stats |

### Auth Flow Logic

```
User clicks Login / Google OAuth
        ↓
Firebase JS SDK authenticates user
        ↓
onAuthStateChanged fires → Zustand authStore updates with user + idToken
        ↓
Axios interceptor auto-attaches Bearer token to all API requests
        ↓
App calls POST /api/v1/auth/sync (upserts user in PostgreSQL)
        ↓
Redirect to /dashboard
```

### Tasks
- [x] Build `Landing.tsx` with hero layout and navigation CTAs
- [x] Build `Login.tsx` with `react-hook-form` + `zod` validation + Firebase email login
- [x] Build `Signup.tsx` with email registration + Firebase `createUserWithEmailAndPassword`
- [x] Add Google OAuth button using Firebase `signInWithPopup(GoogleAuthProvider)`
- [x] Wire post-login API sync call (`authStore` action)
- [x] Build `Dashboard.tsx` (protected, placeholder content)
- [x] Build `Profile.tsx` — calls `GET /api/v1/users/me` and displays data
- [x] Implement logout functionality (Firebase `signOut` + clear Zustand store)

### Verification Gateway

**Manual E2E Tests (run against local stack via `docker compose up`):**

| Test Case | Expected Result |
|-----------|----------------|
| Navigate to `/dashboard` when not logged in | Redirect to `/login` |
| Sign up with new email/password | Account created, redirected to `/dashboard`, user row in DB |
| Log in with existing email/password | Successful login, `/dashboard` loads |
| Log in with Google OAuth | Firebase popup, successful login, `/dashboard` loads |
| `GET /api/v1/users/me` response visible in Profile page | User email + display name rendered |
| Refresh page after login | Auth state persists (Firebase local persistence) |
| Click Logout | Signed out, redirected to `/login` |

---

## Milestone 1.9 — CI/CD & Initial Deployment

### Goal
Configure GitHub Actions CI to run backend tests and frontend type-checks on every push. Deploy the skeleton backend to Railway and the skeleton frontend to Vercel.

### Files to Create

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI: lint, typecheck, pytest on push to any branch |
| `.github/workflows/deploy-backend.yml` | CD: auto-deploy to Railway on push to `main` |
| `backend/Procfile` | Railway process file (web + worker services) |
| `vercel.json` | Vercel deployment config for SPA routing |

### CI Pipeline (`ci.yml`) Stages

```yaml
1. Backend CI:
   - Setup Python 3.11 via uv
   - Install backend requirements
   - Run: ruff check backend/        # Linting
   - Run: pytest backend/tests/ -v   # All unit tests must pass

2. Frontend CI:
   - Setup Node 20
   - npm ci
   - npm run build                   # TypeScript compile check
```

### Required Environment Variables (Railway + Vercel)

**Railway (Backend):**
```
DATABASE_URL
REDIS_URL
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_KEY_B64
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
CLOUDFLARE_R2_BUCKET_NAME
CLOUDFLARE_R2_ENDPOINT_URL
SECRET_KEY
```

**Vercel (Frontend):**
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_API_BASE_URL            # Railway backend URL
```

### Tasks
- [ ] Write `ci.yml` with backend + frontend CI stages
- [ ] Install `ruff` as a dev dependency for linting
- [ ] Configure Railway project — link GitHub repo, set env vars
- [ ] Configure Vercel project — link GitHub repo, set env vars
- [ ] Push to `main` and verify CI passes
- [ ] Verify Railway deployment returns `GET /health → 200`
- [ ] Verify Vercel deployment serves frontend and OAuth redirect domain is whitelisted in Firebase

### Verification Gateway
```bash
# CI must pass on GitHub Actions
# Both deployment URLs must be accessible:
curl https://<railway-backend-url>/health
# Expected: {"status": "ok", "database": "connected"}

# Open https://<vercel-frontend-url>
# Expected: Landing page renders, login/signup flows work against production backend
```

---

## Required Environment Variables (`.env.example`)

```env
# ── Database ──────────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://voiceclone:password@localhost:5432/voiceclone

# ── Redis / Celery ─────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379/0

# ── Firebase (Backend) ─────────────────────────────────────────────
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./serviceAccountKey.json
# For production (Railway) — base64 of the JSON file:
FIREBASE_SERVICE_ACCOUNT_KEY_B64=

# ── Cloudflare R2 ──────────────────────────────────────────────────
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=voice-clone-storage
CLOUDFLARE_R2_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com

# ── Security ───────────────────────────────────────────────────────
SECRET_KEY=change-me-to-a-long-random-string

# ── Frontend (Vite) ────────────────────────────────────────────────
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=http://localhost:8000
```

---

## Testing Strategy for Phase 1

| Test Type | Tool | Location | Coverage |
|-----------|------|----------|----------|
| Unit Tests | `pytest` + `pytest-asyncio` | `backend/tests/unit/` | Config loading, user service upsert logic, JWT decode mock |
| Integration Tests | `pytest` + `httpx.AsyncClient` | `backend/tests/integration/` | Health endpoint, `/auth/sync`, `/users/me` against real test DB |
| Frontend Type Safety | `tsc --noEmit` | CI pipeline | All TypeScript files compile without errors |
| E2E Auth Smoke Test | Manual | Local stack | Login, signup, OAuth, protected route redirect |

### Backend Test File Structure

```
backend/tests/
├── conftest.py                  # pytest fixtures: test DB session, mock Firebase token
├── unit/
│   ├── test_config.py           # Settings loading from environment
│   └── test_user_service.py     # Upsert logic with mocked DB session
└── integration/
    ├── test_health.py           # GET /health returns 200
    ├── test_auth_sync.py        # POST /auth/sync creates/updates user
    └── test_users_me.py         # GET /users/me returns correct user data
```

---

## Phase 1 Completion Criteria

Phase 1 is **complete and ready for Phase 2** when ALL of the following are true:

- [ ] All 9 milestones are implemented and verified
- [ ] All `pytest` tests pass with `0 failures, 0 errors`
- [ ] `npm run build` completes with `0 TypeScript errors`
- [ ] GitHub Actions CI is green on the `main` branch
- [ ] Railway backend URL responds to `GET /health`
- [ ] Vercel frontend URL is accessible and auth flows work end-to-end
- [ ] All sensitive `.env` files and `serviceAccountKey.json` are gitignored and confirmed absent from the repository
- [ ] Commit history is clean with descriptive commit messages

---

## Progress Log

| Date | Milestone | Git Commit | Notes |
|------|-----------|-----------|-------|
| 2026-08-16 | 1.1 | addb1e2 | Initialized Git, scaffolded base folders, added env template, initial commit |
| 2026-08-16 | 1.2 | 2473aa4 | Created docker-compose.yml, Dockerfile.api, Dockerfile.worker, and .env |
| 2026-08-16 | 1.3 | 15c2c00 | Scaffolded FastAPI backend, connected asyncpg engine, tested health endpoint |
| 2026-08-16 | 1.4 | 795b9c2 | Created DB models, injected custom triggers, applied Alembic baseline |
| 2026-08-16 | 1.5 | 6b69638 | Implemented Firebase Auth middleware and GET /users/me protected endpoint |
| 2026-08-16 | 1.6 | e8d2bcb | Implemented core auth API routes, user schemas, and async service logic |
| 2026-08-17 | 1.7 | c629fb4 | Frontend scaffold with Vite, React, TS, Tailwind, shadcn, and Firebase setup |
| 2026-08-17 | 1.8 | f09dc54 | Implemented Frontend Auth Flows, Login, Signup, Landing, Dashboard, and Profile pages |
