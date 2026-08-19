# 📋 Voice Clone — Phase 2 Development Plan
### Voice Cloning Pipeline · UI/Playback Completion · API Hardening · Production Readiness

**Phase**: 2 of 4  
**Timeline**: Week 3–8  
**Status**: 🟡 In Progress  
**Last Updated**: 2026-08-18

---

## 1. Architecture & Constraint Analysis

### 1.1 Current System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                               │
│  React 19 + Vite 8 + TypeScript 6 + Zustand + Axios + WaveSurfer.js       │
│  Deployed on: Vercel (Free Tier)                                            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTPS  (Bearer Token: Firebase JWT)
                    ┌────────────▼─────────────┐
                    │   FastAPI (Uvicorn/Gunicorn)│
                    │   Port 8000 | Python 3.11  │
                    │   Deployed on: Railway     │
                    │   Procfile: web + worker   │
                    └──┬────────────────────┬───┘
                       │                    │
          ┌────────────▼──────┐   ┌─────────▼──────────────┐
          │   PostgreSQL       │   │    Redis (Railway)      │
          │   (Railway Plugin) │   │    Celery Broker +      │
          │   SQLAlchemy 2.0   │   │    Result Backend       │
          │   Alembic Migr.    │   └─────────────────────────┘
          └───────────────────┘             │
                                  ┌─────────▼──────────────┐
                                  │   Celery Worker         │
                                  │   (same Railway service)│
                                  │   Procfile: worker      │
                                  └─────────────────────────┘
                                            │
                    ┌───────────────────────┤───────────────────────┐
                    │                       │                       │
         ┌──────────▼──────┐    ┌───────────▼───────┐   ┌──────────▼──────┐
         │   ElevenLabs    │    │  Cloudflare R2     │   │  Firebase Admin │
         │   API (TTS +    │    │  (S3-compatible)   │   │  SDK (JWT Verif)│
         │   Voice Cloning)│    │  Audio File Store  │   │                 │
         └─────────────────┘    └───────────────────┘   └─────────────────┘
```

### 1.2 Free-Tier Constraint Map

| Service | Free-Tier Limit | Impact on Design | Mitigation |
|---------|----------------|-----------------|------------|
| **Railway (Backend)** | $5/mo credit; 500 MB RAM; sleeps after inactivity | Celery worker shares memory with API | Use gunicorn workers efficiently; keep ML models out of worker memory (ElevenLabs handles it) |
| **Railway (PostgreSQL)** | 1 GB storage; shared instance | Limited row capacity | Enforce `LIMIT 50` on list queries; implement soft deletes |
| **Railway (Redis)** | 25 MB memory | Celery tasks must be lightweight | Store only task IDs + status in Redis, never audio bytes |
| **Vercel (Frontend)** | 100 GB bandwidth; 12 Edge Functions | Build output must stay under 300 MB | Tree-shake imports; lazy-load WaveSurfer.js only on player pages |
| **Cloudflare R2** | 10 GB storage; 10M reads/mo; 1M writes/mo | Audio files accumulate | Implement a max-per-user quota; auto-delete failed/old generations |
| **Firebase Auth** | 10K verifications/mo | Fine for v1.0 | — |
| **ElevenLabs Starter** | 30,000 chars/mo; up to 10 custom voices; 128 kbps | Core cloning constraint | Enforce per-user char budget in UserUsageStats; display usage meter in UI |

### 1.3 Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | React | 19 |
| Build Tool | Vite | 8 |
| Language | TypeScript | 6 |
| Routing | React Router | 7 |
| State Management | Zustand | 5 |
| UI Components | shadcn/ui + Radix UI | latest |
| Styling | Tailwind CSS | 3 |
| Form Validation | React Hook Form + Zod | 7 / 4 |
| HTTP Client | Axios | 1 |
| Audio Player | WaveSurfer.js | 7 (installed, NOT yet integrated) |
| Auth Client | Firebase JS SDK | 12 |
| Backend Framework | FastAPI | 0.115 |
| Runtime | Python | 3.11 |
| Async Server | Uvicorn + Gunicorn | 0.30 / 22 |
| ORM | SQLAlchemy (async + sync) | 2.0 |
| Migrations | Alembic | 1.13 |
| Task Queue | Celery + Redis | 5.4 / 5 |
| Auth Backend | Firebase Admin SDK | 6 |
| TTS / Voice Clone | ElevenLabs API (httpx) | v1 |
| Object Storage | Cloudflare R2 (boto3) | S3-compatible |

---

## 2. Phase 1 Completion Audit (Baseline for Phase 2)

| Milestone | Status | Commit |
|-----------|--------|--------|
| 1.1 Monorepo & Git | ✅ Complete | addb1e2 |
| 1.2 Docker Compose | ✅ Complete | 2473aa4 |
| 1.3 Backend Skeleton | ✅ Complete | 15c2c00 |
| 1.4 DB Models & Alembic | ✅ Complete | 795b9c2 |
| 1.5 Firebase Auth Middleware | ✅ Complete | 6b69638 |
| 1.6 Core Auth API Endpoints | ✅ Complete | e8d2bcb |
| 1.7 Frontend Scaffold | ✅ Complete | c629fb4 |
| 1.8 Frontend Auth Flows | ✅ Complete | f09dc54 |
| 1.9 CI/CD & Deployment | ✅ Complete | 0615652 |

### Outstanding Bugs Fixed in Pre-Phase-2

| Bug | Fix Commit | Status |
|-----|-----------|--------|
| `SessionLocal` ImportError crashing Railway deployment | c05b487 | ✅ Fixed |
| `ELEVENLABS_API_KEY` env var missing on Railway | — | ❌ OPEN — must add before first cloning test |
| R2 bucket not yet provisioned | — | ❌ OPEN — see Milestone 2.3 |

---

## 3. Phase 2 Objectives

By the end of Phase 2, the following must be achieved:

1. **Cloudflare R2 bucket provisioned** and connected to API + Celery worker.
2. **End-to-end voice cloning pipeline working** — upload audio → ElevenLabs creates voice → external_voice_id saved to DB.
3. **End-to-end TTS generation working** — text → Celery → ElevenLabs → R2 → presigned URL returned.
4. **WaveSurfer.js audio player integrated** on the Generate page with waveform visualization.
5. **Dashboard overhauled** with real usage data, voice count, recent generation history.
6. **Backend APIs hardened** with Pydantic schemas, async DB, shared dependencies, quota enforcement.
7. **All async/sync issues resolved** in voices.py and generations.py route handlers.
8. **Complete test suite** for all Phase 2 milestones passing in CI.

---

## 4. Milestone Overview

| # | Milestone | Description | Status |
|---|-----------|-------------|--------|
| 2.1 | API Refactor & Pydantic Schemas | Harden all routes with proper schemas, async DB, shared deps | ✅ Done |
| 2.2 | Usage Tracking & Quota Enforcement | Track char usage + enforce ElevenLabs limits per user | ✅ Done |
| 2.3 | Cloudflare R2 Provisioning | Bucket creation, CORS config, env var wiring | ✅ Done |
| 2.4 | Voice Cloning Pipeline E2E Test | Validate: upload → ElevenLabs → DB → ready | ✅ Done |
| 2.5 | TTS Generation Pipeline E2E Test | Validate: text → Celery → ElevenLabs → R2 → presigned URL | ✅ Done |
| 2.6 | WaveSurfer.js Audio Player | Integrate waveform player; replace native audio element | ✅ Done |
| 2.7 | Dashboard Overhaul | Live stats, usage meter, recent history feed | ✅ Done |
| 2.8 | Voice Profile Detail Page | /voices/:id — voice info, history, generate, delete | ✅ Done |
| 2.9 | Error Handling & UX Polish | Toast notifications, loading skeletons, empty states | ✅ Done |
| 2.10 | Backend Tests (Phase 2) | Unit + integration tests for all new endpoints and tasks | 🔴 Not Started |
| 2.11 | Frontend TypeScript Cleanup | Remove any types, add interfaces, tsc --noEmit clean | 🔴 Not Started |
| 2.12 | Production Deployment Validation | Env vars checklist, Railway redeploy, E2E smoke test | 🔴 Not Started |

---

## 5. Milestone 2.1 — API Refactor & Pydantic Schemas

### Problem Statement
Two critical issues in current routes:
1. **Duplicate `get_current_user`** defined in both voices.py and generations.py instead of shared from dependencies.py.
2. **Synchronous `db: Session` inside async FastAPI routes** — blocks the event loop on every DB call.

### Files to Modify / Create

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/api/dependencies.py` | MODIFY | Add shared async `get_current_user` using AsyncSession |
| `backend/app/schemas/voice_schema.py` | NEW | Pydantic v2 schemas: VoiceCreate, VoiceResponse, SampleUploadResponse |
| `backend/app/schemas/generation_schema.py` | NEW | Pydantic v2 schemas: GenerateRequest, GenerationResponse, GenerationListItem |
| `backend/app/api/routes/voices.py` | MODIFY | Use AsyncSession, shared dep, proper response models |
| `backend/app/api/routes/generations.py` | MODIFY | Use AsyncSession, shared dep, proper response models |

### New Dependencies Required
None — all needed libraries are already installed.

### Verification Gateway
```bash
cd backend && source .venv/bin/activate
python -c "import app.main; print('Import OK')"
ruff check app/api/routes/ app/schemas/
pytest tests/unit/test_voice_schema.py tests/unit/test_generation_schema.py -v
```

---

## 6. Milestone 2.2 — Usage Tracking & Quota Enforcement

### Goal
Track characters consumed per user on every TTS generation. Enforce ElevenLabs Starter plan limits (30,000 chars/mo) to prevent overage charges.

### Files to Modify / Create

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/models/usage_stats.py` | VERIFY | Confirm chars_used_this_month and voices_created columns exist |
| `backend/app/services/usage_service.py` | NEW | increment_char_usage(), check_quota(), get_user_quota_status() |
| `backend/app/api/routes/generations.py` | MODIFY | Call check_quota() before dispatching Celery; return 429 if over limit |
| `backend/app/api/routes/users.py` | MODIFY | Return quota_status in /users/me response |

### Quota Constants
```python
MONTHLY_CHAR_LIMIT = 30_000   # ElevenLabs Starter plan
MAX_CUSTOM_VOICES = 10         # ElevenLabs Starter plan
```

### Verification Gateway
```bash
pytest tests/unit/test_usage_service.py -v
# Tests: quota check passes under limit, raises 429 at limit, increments correctly
```

---

## 7. Milestone 2.3 — Cloudflare R2 Bucket Provisioning

### Goal
Provision the R2 bucket, configure CORS, create API tokens, and wire up all environment variables.

### Step-by-Step Setup Guide

**Step 1**: Cloudflare Dashboard → R2 Object Storage → Create Bucket
- Name: `voice-clone-storage`
- Region: Automatic

**Step 2**: Configure CORS on the bucket:
```json
[{
  "AllowedOrigins": ["https://<vercel-domain>.vercel.app", "http://localhost:5173"],
  "AllowedMethods": ["GET"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}]
```

**Step 3**: R2 → Manage API Tokens → Create Token
- Permissions: Object Read & Write
- Scope: specific bucket → voice-clone-storage

**Step 4**: Add to Railway environment variables:
```
CLOUDFLARE_R2_ACCESS_KEY_ID=<token_access_key>
CLOUDFLARE_R2_SECRET_ACCESS_KEY=<token_secret_key>
CLOUDFLARE_R2_BUCKET_NAME=voice-clone-storage
CLOUDFLARE_R2_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com
```

### Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `backend/tests/integration/test_r2_connection.py` | NEW | R2 connectivity smoke test |
| `.env.example` | MODIFY | Document R2 env var format |

### Verification Gateway
```bash
pytest tests/integration/test_r2_connection.py -v -s
# Expected: PASSED — upload and presigned URL generation succeeded
```

---

## 8. Milestone 2.4 — Voice Cloning Pipeline End-to-End Test

### Pre-conditions
- ElevenLabs Starter API key set as `ELEVENLABS_API_KEY` in `.env` and Railway
- R2 bucket provisioned (Milestone 2.3 complete)

### Code Already Implemented (Verify Correctness)

| File | Status | Notes |
|------|--------|-------|
| `backend/app/services/audio/tts_engine.py` — `add_voice()` | IMPLEMENTED | Sends multipart form to v1/voices/add |
| `backend/app/services/audio/tasks.py` — `task_process_voice_profile()` | IMPLEMENTED | Updates profile status in DB, handles cleanup |
| `backend/app/api/routes/voices.py` — `POST /{voice_id}/samples` | IMPLEMENTED | Saves files to /tmp, dispatches Celery |

### Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `backend/tests/integration/test_voice_pipeline.py` | NEW | Integration test: mock ElevenLabs, assert DB status transitions |
| `backend/tests/unit/test_tts_engine.py` | NEW | Unit tests: add_voice() with mocked httpx responses |

### Test Specifications

```python
# backend/tests/unit/test_tts_engine.py

@patch("httpx.Client.post")
def test_add_voice_success(mock_post):
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"voice_id": "abc123"}
    with tempfile.NamedTemporaryFile(suffix=".mp3") as f:
        result = tts_engine.add_voice("Test Voice", "desc", [f.name])
    assert result == "abc123"

@patch("httpx.Client.post")
def test_add_voice_api_error(mock_post):
    mock_post.return_value.status_code = 422
    mock_post.return_value.text = "Unprocessable"
    with pytest.raises(Exception, match="ElevenLabs API Error: 422"):
        with tempfile.NamedTemporaryFile(suffix=".mp3") as f:
            tts_engine.add_voice("Test", "", [f.name])
```

### Manual E2E Verification
```
1. Navigate to /voices
2. Create voice profile: name = "Test Voice"
3. Upload a 10-second clean speech audio sample
4. DB check: SELECT status, external_voice_id FROM voice_profiles WHERE name = 'Test Voice';
   → status transitions: pending → processing → ready
   → external_voice_id populated with ElevenLabs voice ID
5. Navigate to /generate → "Test Voice" appears as selectable
```

---

## 9. Milestone 2.5 — TTS Generation Pipeline End-to-End Test

### Issue to Fix First
Current `generate_speech()` uses `eleven_monolingual_v1`. For custom voices on Starter plan, change to `eleven_turbo_v2`.

### Files to Modify / Create

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/services/audio/tts_engine.py` | MODIFY | Change model to `eleven_turbo_v2`; add model_id param |
| `backend/tests/unit/test_tts_generation.py` | NEW | Unit tests for generate_speech() with mocked httpx |
| `backend/tests/integration/test_generation_pipeline.py` | NEW | Integration test: mock ElevenLabs + R2, assert DB status flow |

### Test Specifications

```python
# backend/tests/unit/test_tts_generation.py

@patch("httpx.Client.post")
def test_generate_speech_success(mock_post):
    mock_post.return_value.status_code = 200
    mock_post.return_value.content = b"fake_audio_bytes"
    result = tts_engine.generate_speech("Hello world", "voice_abc")
    assert result == b"fake_audio_bytes"

@patch("httpx.Client.post")
def test_generate_speech_api_failure(mock_post):
    mock_post.return_value.status_code = 401
    mock_post.return_value.text = "Unauthorized"
    with pytest.raises(Exception, match="ElevenLabs API Error: 401"):
        tts_engine.generate_speech("Hello", "bad_voice_id")
```

### Verification Gateway
```bash
pytest tests/unit/test_tts_generation.py tests/integration/test_generation_pipeline.py -v

# Manual E2E:
# 1. Navigate to /generate
# 2. Select any ElevenLabs pre-made voice
# 3. Enter text: "Hello, this is a test."
# 4. Click Generate Speech
# 5. Status shows "processing" → transitions to "completed"
# 6. Audio player appears (after Milestone 2.6)
# 7. Download button works
```

---

## 10. Milestone 2.6 — WaveSurfer.js Audio Player Component

### Note
`wavesurfer.js@7.12.11` is already installed in frontend/package.json. No new install needed.

### Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/components/audio/WavePlayer.tsx` | NEW | Reusable waveform player component |
| `frontend/src/components/audio/index.ts` | NEW | Barrel export for audio components |
| `frontend/src/pages/Generate.tsx` | MODIFY | Replace native audio element with WavePlayer |

### WavePlayer Component Interface

```typescript
interface WavePlayerProps {
  audioUrl: string;
  height?: number;            // default: 80
  waveColor?: string;         // default: "#7c3aed" (purple-600)
  progressColor?: string;     // default: "#a855f7" (purple-400)
  onReady?: () => void;
  showDownload?: boolean;
  downloadFilename?: string;
}
```

### Implementation Requirements
1. Use WaveSurfer.create() with containerRef
2. Load audio from audioUrl prop using wavesurfer.load()
3. Play/Pause button with animated icon state transition
4. Show current time / total duration formatted as M:SS
5. Show download button if showDownload=true (uses anchor download attr)
6. Cleanup: wavesurfer.destroy() on component unmount
7. Loading skeleton while waveform decodes
8. Error state if URL fails to load

### Verification Gateway
```bash
cd frontend && npm run build
# Expected: 0 TypeScript errors

# Visual verification after generating audio:
# 1. WavePlayer renders with visible waveform bars
# 2. Click play — audio plays, progress bar advances
# 3. Click waveform at position — audio seeks
# 4. Download button downloads MP3
```

---

## 11. Milestone 2.7 — Dashboard Overhaul

### New API Endpoint Required

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/users/stats` | Required | voice count, generation count, chars used/remaining |

### Files to Modify / Create

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/api/routes/users.py` | MODIFY | Add GET /users/stats endpoint |
| `backend/app/schemas/user_schema.py` | MODIFY | Add UserStatsResponse Pydantic schema |
| `frontend/src/pages/Dashboard.tsx` | MODIFY | Full rewrite with real data, stat cards, recent activity |
| `frontend/src/hooks/useDashboardStats.ts` | NEW | Custom hook: fetches and caches /users/stats |

### Dashboard UI Requirements
- 4 stat cards: Cloned Voices, Generated Audio, Chars Used, Chars Remaining
- Usage progress bar showing percentage of monthly char quota
- Recent generations list (last 5) with status badges and quick-play button
- Voice profile mini-cards linking to /voices/:id

### Verification Gateway
```bash
pytest tests/integration/test_user_stats.py -v
cd frontend && npm run build

# Visual check:
# 1. Stat cards show real numbers (not hardcoded zeros)
# 2. Progress bar shows correct % of 30,000 char monthly limit
# 3. Recent generations list renders with correct status badges
```

---

## 12. Milestone 2.8 — Voice Profile Detail Page

### New API Endpoints Required

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/voices/{voice_id}` | Required | Voice profile details + sample count |
| `DELETE` | `/api/v1/voices/{voice_id}` | Required | Soft deletes the voice profile |
| `GET` | `/api/v1/voices/{voice_id}/generations` | Required | Paginated generation history for this voice |

### Files to Create / Modify

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/api/routes/voices.py` | MODIFY | Add GET /:id, DELETE /:id, GET /:id/generations endpoints |
| `frontend/src/pages/VoiceDetail.tsx` | NEW | Voice profile detail page component |
| `frontend/src/App.tsx` | MODIFY | Add /voices/:id route |

### Verification Gateway
```bash
pytest tests/integration/test_voice_detail.py -v
# Tests: GET returns correct voice data, DELETE sets deleted_at,
#        other users cannot access this voice (403)

cd frontend && npm run build

# Manual check:
# 1. Navigate to /voices, click a voice card
# 2. /voices/:id loads with voice name, status, sample count
# 3. Generating from this page uses that voice's external_voice_id
# 4. Delete shows confirmation dialog, then removes from list
```

---

## 13. Milestone 2.9 — Error Handling & UX Polish

### New Libraries Required
None — `@radix-ui/react-toast` is already installed via shadcn/ui.

### Files to Modify / Create

| File | Action | Purpose |
|------|--------|---------|
| `frontend/src/components/ui/loading-skeleton.tsx` | NEW | Reusable skeleton loading component |
| `frontend/src/lib/axios.ts` | MODIFY | Global response interceptor for auto-error-toasting |
| `frontend/src/pages/Generate.tsx` | MODIFY | Toast on error; skeleton while loading voices |
| `frontend/src/pages/Voices.tsx` | MODIFY | Success toast on upload complete; error toast on fail |
| `frontend/src/pages/Dashboard.tsx` | MODIFY | Skeleton loading cards while stats fetch |
| `backend/app/core/exceptions.py` | MODIFY | Standardized error response: {detail, code, timestamp} |
| `backend/app/main.py` | MODIFY | Register custom exception handlers for ValueError, PermissionError |

### Verification Gateway
```bash
# Frontend
cd frontend && npm run build

# Manual checks:
# 1. Voice upload success → green toast "Voice is being cloned!"
# 2. Network offline → toast shows "Connection failed"
# 3. Text > 5000 chars → client-side error shown immediately (no API call)
# 4. Dashboard loading → skeleton cards visible for ~500ms
# 5. Failed generation → red error toast with message
```

---

## 14. Milestone 2.10 — Backend Test Suite (Phase 2)

### New Dependency to Add to requirements.txt
```
pytest-mock==3.*
```

### Test File Structure

```
backend/tests/
├── conftest.py                        MODIFY — add async DB fixtures, mock Firebase
├── unit/
│   ├── test_tts_engine.py             NEW — ElevenLabsClient.add_voice() mocked tests
│   ├── test_tts_generation.py         NEW — generate_speech() mocked tests
│   ├── test_usage_service.py          NEW — quota check + increment tests
│   ├── test_voice_schema.py           NEW — Pydantic schema validation tests
│   └── test_generation_schema.py      NEW — Pydantic schema validation tests
└── integration/
    ├── test_r2_connection.py          NEW — R2 upload + presigned URL connectivity
    ├── test_voice_pipeline.py         NEW — mock ElevenLabs, assert DB transitions
    ├── test_generation_pipeline.py    NEW — mock ElevenLabs + R2, assert status flow
    ├── test_user_stats.py             NEW — GET /users/stats returns correct data
    └── test_voice_detail.py           NEW — GET/DELETE /voices/:id auth enforcement
```

### Verification Gateway
```bash
cd backend && source .venv/bin/activate
pytest tests/ -v --tb=short

# CI must show:
# 0 failures, 0 errors
# All tests collected and passed
```

---

## 15. Milestone 2.11 — Frontend TypeScript Cleanup

### Files to Clean Up

| File | Issue | Fix |
|------|-------|-----|
| `frontend/src/pages/Generate.tsx` | `useState<any[]>` for generations | Replace with `GenerationItem` interface |
| `frontend/src/pages/Generate.tsx` | Loose typing on engine_voices | Add `EngineVoice` interface |
| `frontend/src/components/layout/AppLayout.tsx` | Duplicate Mic2 icon for both nav items | Replace Generate nav icon with Wand2 |

### New Types File to Create

```typescript
// frontend/src/lib/types.ts  (NEW)

export interface UserVoice {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'ready' | 'failed' | 'archived';
  external_voice_id?: string;
}

export interface EngineVoice {
  voice_id: string;
  name: string;
  category?: string;
}

export interface GenerationItem {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  text: string;
  created_at: string;
  audio_url?: string;
  error?: string;
}

export interface UserStats {
  voice_count: number;
  generation_count: number;
  chars_used_this_month: number;
  chars_remaining: number;
  monthly_limit: number;
}
```

### Verification Gateway
```bash
cd frontend
npx tsc --noEmit
# Expected: 0 errors

npm run build
# Expected: 0 TypeScript errors, successful Vite build
```

---

## 16. Milestone 2.12 — Production Deployment Validation

### Railway Environment Variables Checklist

```
DATABASE_URL                         ✅ Set
REDIS_URL                            ✅ Set
FIREBASE_PROJECT_ID                  ✅ Set
FIREBASE_SERVICE_ACCOUNT_KEY_B64     ✅ Set
SECRET_KEY                           ✅ Set
ELEVENLABS_API_KEY                   ❌ MISSING — add before Phase 2 testing
CLOUDFLARE_R2_ACCESS_KEY_ID          ❌ MISSING — after Milestone 2.3
CLOUDFLARE_R2_SECRET_ACCESS_KEY      ❌ MISSING — after Milestone 2.3
CLOUDFLARE_R2_BUCKET_NAME            ❌ MISSING — after Milestone 2.3
CLOUDFLARE_R2_ENDPOINT_URL           ❌ MISSING — after Milestone 2.3
```

### Smoke Test Checklist

```bash
# Health check
curl https://<railway-backend>/health
# → {"status": "ok", "database": "connected"}

# Auth sync
curl -X POST https://<railway-backend>/api/v1/auth/sync \
  -H "Authorization: Bearer <firebase_id_token>"
# → {"id": "...", "email": "..."}

# List voices
curl https://<railway-backend>/api/v1/voices/ \
  -H "Authorization: Bearer <firebase_id_token>"
# → {"user_voices": [], "engine_voices": [...]}

# Manual browser E2E:
# Login → /dashboard loads with real stats
# /voices → create voice profile + upload sample
# /generate → generate speech → WavePlayer shows + plays
# /voices/:id → detail page loads, delete works
```

---

## 17. Required Libraries & Dependencies Summary

### Backend Additions (requirements.txt)

```
pytest-mock==3.*        # Milestone 2.10 — structured test mocking
```

> All other required libraries (httpx, boto3, celery, sqlalchemy, pydantic) are already in requirements.txt.

### Frontend Additions (package.json)

> **None required** — wavesurfer.js, zustand, axios, react-hook-form, zod,
> @radix-ui/react-toast, and lucide-react are all already installed.

---

## 18. Phase 2 Completion Criteria

Phase 2 is **complete** when ALL of the following are verified:

| Criterion | Verified By |
|-----------|-------------|
| `pytest tests/ -v` — 0 failures, 0 errors | CI + manual |
| `npm run build` — 0 TypeScript errors | CI + manual |
| GitHub Actions CI green on main | GitHub Actions |
| ElevenLabs voice cloning works E2E on live Railway | Manual browser test |
| TTS generation works E2E → audio plays in WavePlayer | Manual browser test |
| Dashboard shows real stats (not hardcoded zeros) | Manual browser test |
| /voices/:id route loads and delete works | Manual browser test |
| R2 bucket provisioned, audio files accessible via presigned URL | Manual curl test |
| Error toasts appear on failures | Manual network error simulation |
| No sensitive keys committed to Git | git log --all -- "*.env" |

---

## 19. Progress Log

> Updated after each milestone is verified and committed.

| Date | Milestone | Git Commit | Notes |
|------|-----------|-----------|-------|
| 2026-08-18 | Pre-Phase-2 | c05b487 | Fixed SessionLocal ImportError — backend starts cleanly |
| 2026-08-18 | 2.1 | 25d7be4 | API refactor: async routes, shared get_current_user, Pydantic schemas, GET+DELETE /voices/:id |
| 2026-08-18 | 2.2 | 25d7be4 | Usage tracking: chars_generated_this_month added; quota check in generations.py |
| 2026-08-18 | 2.3 | f60aebb | Added R2 integration smoke test and env setup |
| 2026-08-18 | 2.4 | e778eec | Voice Cloning E2E Test: Unit tests and integration tests added and passing |
| 2026-08-18 | 2.5 | 25d7be4 | TTS model upgraded to eleven_turbo_v2; generation task tracks char usage |
| — | 2.6 | — | Pending |
| 2026-08-18 | 2.7 | 564a786 | Dashboard UI rewritten with stats API integration |
| 2026-08-19 | 2.8 | 6ee11e0 | VoiceDetail UI implemented with deletion and generations feed |
| 2026-08-19 | 2.9 | 7d796ac | Added global API interceptors, error toasts, and skeletons |
| — | 2.10 | — | Pending |
| — | 2.11 | — | Pending |
| — | 2.12 | — | Pending |

---

*Document Version: 1.0 · Phase 2 of 4 · Voice Clone v1.0 · Prepared 2026-08-18*
