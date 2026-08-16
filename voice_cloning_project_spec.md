# 🎙️ Voice Clone — AI Voice Cloning Platform
### Project Specification · Solo Full-Stack Developer Edition · v1.0

---

## Overview

**Voice Clone** is a web-based AI voice cloning platform that allows users to upload short audio samples of a person's voice and generate new speech in that cloned voice using a custom text prompt. The system leverages deep generative neural networks for speech synthesis and provides a clean, modern web interface for managing voice profiles, generating audio, and listening to synthesized results.

The goal of v1.0 is a **working, deployable product** with core voice cloning functionality, user authentication, and a minimal but polished UI — no unnecessary complexity.

---

## Core Use Cases (v1.0 Scope)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **User Auth** | Sign up / Log in via Email+Password and Google OAuth |
| 2 | **Voice Upload** | Upload 1–5 audio samples (WAV/MP3, 5–30 sec each) for a voice profile |
| 3 | **Voice Cloning** | Submit text → system generates speech in the cloned voice |
| 4 | **Audio Playback** | In-browser playback of generated audio files |
| 5 | **Voice Library** | Manage saved voice profiles (create, rename, delete) |
| 6 | **User Profile** | View account info, usage stats, manage OAuth connections |
| 7 | **Download Output** | Download the synthesized `.wav` audio file |

> **Out of Scope for v1.0**: Real-time streaming synthesis, multi-language support, voice sharing/marketplace, mobile app, team/org accounts.

---

## Finalized Tech Stack

### 🖥️ Frontend — React

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | **React 18 + Vite** | Fast HMR, minimal config for solo dev |
| Language | **TypeScript** | Type safety, better DX |
| Routing | **React Router v6** | Client-side routing |
| State Management | **Zustand** | Lightweight, no boilerplate (Redux overkill for solo) |
| UI Components | **shadcn/ui + Tailwind CSS** | Pre-built accessible components, fast to style |
| Auth Client | **Firebase JS SDK** | Handles Google OAuth + JWT token management |
| HTTP Client | **Axios** | Interceptors for auth token injection |
| Audio Playback | **WaveSurfer.js** | Waveform visualizer + playback control |
| Form Handling | **React Hook Form + Zod** | Validation without overhead |

---

### ⚙️ Backend — FastAPI (Python)

| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | **FastAPI** | Async, auto-docs (Swagger), fast to build |
| Language | **Python 3.11** | Best ML ecosystem compatibility |
| Auth | **Firebase Admin SDK** | Verifies Firebase JWT tokens server-side |
| Task Queue | **Celery + Redis** | Offloads slow ML inference to background workers |
| File Storage | **AWS S3 / Cloudflare R2** | Store uploaded audio & generated outputs |
| Database | **PostgreSQL** | User profiles, voice metadata, generation history |
| ORM | **SQLAlchemy 2.0 + Alembic** | Async ORM + migrations |
| API Validation | **Pydantic v2** | Built into FastAPI |
| Server | **Uvicorn + Gunicorn** | Production ASGI serving |

---

### 🧠 ML / AI Pipeline

| Component | Technology | Role |
|-----------|-----------|------|
| Feature Extraction | **Librosa** | Extract MFCCs, mel-spectrograms from uploaded audio |
| Speaker Embedding | **SpeechBrain (ECAPA-TDNN)** | Encode speaker identity as a fixed embedding vector |
| Speech Synthesis | **Coqui TTS (XTTS v2)** | State-of-the-art zero-shot voice cloning (Tacotron2-based) |
| Waveform Decoding | **Built into Coqui TTS** | Vocoder included (replaces separate WaveNet) |
| Audio Processing | **NumPy + SoundFile** | Waveform normalization, format conversion |
| Runtime | **PyTorch 2.x (CUDA optional)** | Model inference engine |

> **Why Coqui XTTS v2 over raw Tacotron2?**  
> Building Tacotron2 + WaveNet from scratch is a months-long effort. XTTS v2 is a production-grade, open-source model that does zero-shot voice cloning from reference audio — it embeds the speaker's voice internally and generates cloned speech from a text prompt. This is the correct tool for the described use case without reinventing the wheel.

---

### 🔐 Authentication & Authorization

| Concern | Solution |
|---------|---------|
| Auth Provider | **Firebase Authentication** |
| Methods | Email/Password + **Google OAuth 2.0** |
| Token Strategy | Firebase issues **JWT (ID Token)** → sent as `Bearer` in all API requests |
| Backend Verification | FastAPI middleware verifies JWT via **Firebase Admin SDK** |
| Session | Stateless — no server sessions, token-refreshed client-side |
| Protected Routes | React `<PrivateRoute>` wrapper + backend dependency injection |

---

### 🗄️ Data Model (Simplified)

```
users
  id, firebase_uid, email, display_name, avatar_url, created_at

voice_profiles
  id, user_id (FK), name, description, sample_urls[], embedding_path, created_at

generation_history
  id, user_id (FK), voice_profile_id (FK), input_text, output_audio_url, duration_sec, created_at, status
```

---

### 🚀 Infrastructure & Deployment

| Service | Purpose |
|---------|---------|
| **Railway / Render** | Backend (FastAPI) + Celery Worker hosting |
| **Vercel** | Frontend (React + Vite) hosting |
| **Redis Cloud (free tier)** | Celery broker + result backend |
| **Supabase / Neon** | Managed PostgreSQL (free tier) |
| **Cloudflare R2** | S3-compatible object storage (generous free tier) |
| **Firebase** | Auth only (free Spark plan) |
| **GitHub Actions** | CI/CD — lint, test, auto-deploy on push |

> **GPU Inference**: For v1.0, use a **CPU-based inference on Railway** (slower but free/cheap). When ready to scale, move the Celery ML worker to a **RunPod / Vast.ai GPU instance** or a dedicated VM.

---

## Application Screens

```
/                    → Landing Page (hero, features, CTA)
/login               → Login (Email + Google OAuth)
/signup              → Sign Up (Email + Google OAuth)
/dashboard           → Voice Library (list of voice profiles)
/voices/new          → Create Voice Profile (upload audio samples)
/voices/:id          → Voice Profile Detail (generate speech, history)
/voices/:id/edit     → Edit Voice Profile (rename, add/remove samples)
/profile             → User Profile & Account Settings
```

---

## ML Pipeline Flow

```
User uploads audio samples
        ↓
[Celery Task] Librosa → preprocess audio (normalize, trim silence, resample to 22050 Hz)
        ↓
[Celery Task] XTTS v2 encodes speaker embedding from reference audio
        ↓
Embedding stored in S3, path saved to DB
        ↓
User submits text prompt
        ↓
[Celery Task] XTTS v2 synthesizes waveform using embedding + text
        ↓
NumPy/SoundFile → normalize + export as WAV
        ↓
WAV uploaded to S3/R2, URL saved to generation_history
        ↓
Frontend polls task status → streams/plays audio on completion
```

---

## Project Structure (Monorepo)

```
voice_clone/
├── frontend/               # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/          # Zustand stores
│   │   └── lib/            # axios instance, firebase config
│   └── vite.config.ts
│
├── backend/                # FastAPI + Python
│   ├── app/
│   │   ├── api/            # Route handlers
│   │   ├── core/           # Config, security, firebase
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── tasks/          # Celery ML tasks
│   ├── alembic/            # DB migrations
│   ├── requirements.txt
│   └── Dockerfile
│
├── .github/
│   └── workflows/          # CI/CD pipelines
│
└── docker-compose.yml      # Local dev (FastAPI + Redis + PostgreSQL)
```

---

## Development Phases

### Phase 1 — Foundation (Week 1–2)
- [ ] Monorepo setup, Docker Compose for local dev
- [ ] Firebase project setup (Auth, Google OAuth)
- [ ] FastAPI skeleton with Firebase JWT middleware
- [ ] PostgreSQL schema + Alembic migrations
- [ ] React app scaffold with auth flows (Login, Signup, Google OAuth)
- [ ] Protected routing + profile screen

### Phase 2 — Voice Cloning Core (Week 3–5)
- [ ] File upload API + S3/R2 integration
- [ ] Celery + Redis setup
- [ ] Integrate Coqui XTTS v2 model
- [ ] Audio preprocessing pipeline (Librosa + NumPy)
- [ ] Voice profile creation flow (frontend + backend)
- [ ] Text-to-speech generation endpoint + task polling

### Phase 3 — UI & Playback (Week 6–7)
- [ ] Voice Library dashboard
- [ ] Voice profile detail page with WaveSurfer.js player
- [ ] Generation history list
- [ ] Audio download functionality
- [ ] Loading/progress states for async tasks

### Phase 4 — Polish & Deploy (Week 8)
- [ ] Error handling, input validation (frontend + backend)
- [ ] GitHub Actions CI/CD pipeline
- [ ] Deploy backend to Railway, frontend to Vercel
- [ ] Configure Cloudflare R2 CORS, production env vars
- [ ] End-to-end smoke testing

---

## Key Constraints & Decisions

| Decision | Rationale |
|----------|-----------|
| Firebase Auth over custom JWT | Eliminates auth security complexity for solo dev |
| Coqui XTTS v2 over Tacotron2 from scratch | Reduces ML engineering time from months to days |
| Celery for inference | Keeps API response times fast; inference can take 10–60s |
| Zustand over Redux | Sufficient for app state, drastically less boilerplate |
| Cloudflare R2 over AWS S3 | No egress fees, S3-compatible, better free tier |
| Monorepo | Single repo = simpler CI/CD for solo dev |

---

*Document Version: 1.0 · Prepared for Solo Full-Stack Development · Voice Clone v1.0*
