# 🗄️ Voice Clone — Database Design Specification

**Stack**: PostgreSQL (Supabase / Neon free tier) · SQLAlchemy 2.0 Async ORM · Alembic Migrations  
**Standard**: Production-Grade, Scalable, Auditable — aligned with industry best practices.

---

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| **UUID Primary Keys** | All tables use `UUID v4` — prevents ID enumeration attacks, safe for distributed future |
| **Soft Deletes** | `deleted_at TIMESTAMPTZ` pattern — data is never hard-deleted, enabling restore and audit trails |
| **Immutable Audit Trail** | `created_at`, `updated_at` on every row; `status` enums for lifecycle tracking |
| **Referential Integrity** | All foreign keys are properly declared with `ON DELETE` constraints |
| **Row-Level Security Ready** | Tables include `user_id` on all user-owned data — compatible with future Supabase RLS policies |
| **Enum Types** | Postgres native `ENUM` types for finite state fields — prevents invalid state injection |
| **Indexing Strategy** | Composite and partial indexes on every high-traffic query path |
| **Timezone-Aware Timestamps** | All timestamps stored as `TIMESTAMPTZ` (UTC) — prevents timezone bugs in production |

---

## Entity Relationship Overview

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────────────┐
│    users    │──1:N──│  voice_profiles  │──1:N──│  generation_history  │
└─────────────┘       └──────────────────┘       └──────────────────────┘
       │                       │
       │                       │──1:N──┌──────────────────────┐
       │                               │  voice_audio_samples │
       │                               └──────────────────────┘
       │
       │──1:1──┌───────────────────┐
               │  user_usage_stats │
               └───────────────────┘
```

---

## Enum Type Definitions

```sql
-- Voice profile lifecycle
CREATE TYPE voice_profile_status AS ENUM (
    'pending',      -- Samples uploaded, embedding not yet processed
    'processing',   -- Celery worker actively computing embedding
    'ready',        -- Embedding computed and stored; cloning available
    'failed',       -- Embedding processing failed; user must re-upload
    'archived'      -- Soft-deactivated by user
);

-- TTS generation task lifecycle
CREATE TYPE generation_status AS ENUM (
    'queued',       -- Task submitted to Celery/Redis
    'processing',   -- Worker picked up the task and is running TTS
    'completed',    -- WAV generated and uploaded to Cloudflare R2
    'failed'        -- Inference or upload failed
);

-- Authentication provider types
CREATE TYPE auth_provider AS ENUM (
    'email',
    'google'
);
```

---

## Table 1 — `users`
**Purpose**: Canonical identity store for every account. Firebase is the auth provider; this table holds the application-level user record.

```sql
CREATE TABLE users (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Firebase Identity
    firebase_uid        VARCHAR(128)    NOT NULL UNIQUE,     -- Firebase UID (stable, never changes)
    auth_provider       auth_provider   NOT NULL DEFAULT 'email',

    -- Profile Data
    email               VARCHAR(320)    NOT NULL UNIQUE,     -- RFC 5321 max length
    display_name        VARCHAR(100),
    avatar_url          TEXT,                                -- CDN URL to profile image

    -- Account State
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_email_verified   BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_login_at       TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ     DEFAULT NULL         -- NULL = active; set = soft-deleted
);

-- Indexes
CREATE INDEX idx_users_firebase_uid    ON users (firebase_uid);
CREATE INDEX idx_users_email           ON users (email);
CREATE INDEX idx_users_active          ON users (is_active) WHERE deleted_at IS NULL;
```

**Scalability Notes**:
- Adding new OAuth providers (GitHub, Apple) only requires altering the `auth_provider` enum.
- `deleted_at` soft-delete allows GDPR-compliant data anonymization without cascading deletes.
- `last_login_at` supports future inactive account cleanup jobs.

---

## Table 2 — `voice_profiles`
**Purpose**: Represents a named, reusable voice identity. A user can own multiple voice profiles. After audio samples are processed, a speaker embedding is stored externally (Cloudflare R2), and a path reference is saved here.

```sql
CREATE TABLE voice_profiles (
    id                  UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                    NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Voice Identity
    name                VARCHAR(100)            NOT NULL,
    description         TEXT,

    -- ML Artifacts
    embedding_r2_path   TEXT,                               -- R2 path to .npy speaker embedding file
    status              voice_profile_status    NOT NULL DEFAULT 'pending',
    processing_error    TEXT,                               -- Error message if status = 'failed'

    -- Metadata
    sample_count        SMALLINT                NOT NULL DEFAULT 0,
    total_duration_sec  NUMERIC(8,2),

    -- Audit
    created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ             DEFAULT NULL
);

-- Indexes
CREATE INDEX idx_voice_profiles_user_id         ON voice_profiles (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_voice_profiles_status          ON voice_profiles (status);
CREATE INDEX idx_voice_profiles_user_status     ON voice_profiles (user_id, status) WHERE deleted_at IS NULL;
```

**Scalability Notes**:
- `embedding_r2_path` decouples the model artifact from the DB — switching from R2 to GCS only requires a path update.
- `status` enum supports future states (e.g., `retraining`) without schema changes.
- Composite index on `(user_id, status)` handles the primary dashboard query efficiently.

---

## Table 3 — `voice_audio_samples`
**Purpose**: One-to-many child table storing each individual audio file uploaded for a voice profile. Separated from `voice_profiles` for normalization, enabling per-sample metadata and deletion without restructuring.

```sql
CREATE TABLE voice_audio_samples (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    voice_profile_id    UUID            NOT NULL REFERENCES voice_profiles(id) ON DELETE CASCADE,
    user_id             UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Storage
    r2_object_key       TEXT            NOT NULL UNIQUE,
    original_filename   VARCHAR(255)    NOT NULL,
    file_size_bytes     INTEGER         NOT NULL,
    mime_type           VARCHAR(50)     NOT NULL,

    -- Audio Properties (populated after preprocessing)
    duration_sec        NUMERIC(8,2),
    sample_rate_hz      INTEGER,
    channels            SMALLINT,
    is_preprocessed     BOOLEAN         NOT NULL DEFAULT FALSE,

    -- Audit
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ     DEFAULT NULL,

    CONSTRAINT chk_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 52428800),
    CONSTRAINT chk_mime_type CHECK (mime_type IN ('audio/wav', 'audio/mpeg', 'audio/x-wav'))
);

-- Indexes
CREATE INDEX idx_voice_samples_profile_id   ON voice_audio_samples (voice_profile_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_voice_samples_user_id      ON voice_audio_samples (user_id);
```

**Scalability Notes**:
- `CHECK` constraints at the database level enforce business rules independently of the API layer.
- `is_preprocessed` flag supports re-processing pipelines without re-uploading.
- Soft delete allows a user to "remove" a sample from a profile while the audio file in R2 gets cleaned up async.

---

## Table 4 — `generation_history`
**Purpose**: An append-only log of every TTS synthesis request. Acts as an audit log, user history, and the mechanism for the Celery task polling API. Rows are **never updated directly** — only `status`, `output_r2_path`, and `error_message` are mutated by the Celery worker.

```sql
CREATE TABLE generation_history (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    voice_profile_id    UUID                REFERENCES voice_profiles(id) ON DELETE SET NULL,

    -- Task Tracking
    celery_task_id      VARCHAR(255)        UNIQUE,
    status              generation_status   NOT NULL DEFAULT 'queued',

    -- Input
    input_text          TEXT                NOT NULL,
    input_text_length   INTEGER             GENERATED ALWAYS AS (char_length(input_text)) STORED,

    -- Output (populated by Celery worker on completion)
    output_r2_path      TEXT,
    output_duration_sec NUMERIC(8,2),

    -- Error Handling
    error_message       TEXT,
    retry_count         SMALLINT            NOT NULL DEFAULT 0,

    -- Performance Metrics
    queued_at           TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,

    -- Audit
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_input_text_length CHECK (char_length(input_text) BETWEEN 1 AND 5000),
    CONSTRAINT chk_retry_count CHECK (retry_count >= 0 AND retry_count <= 5)
);

-- Indexes
CREATE INDEX idx_gen_history_user_id        ON generation_history (user_id, created_at DESC);
CREATE INDEX idx_gen_history_voice_profile  ON generation_history (voice_profile_id);
CREATE INDEX idx_gen_history_celery_task    ON generation_history (celery_task_id);
CREATE INDEX idx_gen_history_status         ON generation_history (status) WHERE status IN ('queued', 'processing');
CREATE INDEX idx_gen_history_user_status    ON generation_history (user_id, status);
```

**Scalability Notes**:
- Partial index on `status IN ('queued', 'processing')` keeps the active-task polling query lean — covers only a tiny fraction of all rows.
- `celery_task_id` allows the FastAPI polling endpoint to query by Celery ID without scanning all rows.
- `GENERATED ALWAYS AS` computed column avoids application-level bugs in text length calculation.
- Performance timing columns (`queued_at`, `started_at`, `completed_at`) enable future SLA monitoring dashboards.

---

## Table 5 — `user_usage_stats`
**Purpose**: Denormalized 1:1 materialized summary per user. Tracks cumulative usage to support future rate limiting, free/paid tier enforcement, and analytics dashboards — without running expensive `COUNT()` queries on `generation_history` on every API call.

```sql
CREATE TABLE user_usage_stats (
    user_id                 UUID            PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    -- Cumulative Counters
    total_generations       INTEGER         NOT NULL DEFAULT 0,
    total_voice_profiles    INTEGER         NOT NULL DEFAULT 0,
    total_audio_uploads     INTEGER         NOT NULL DEFAULT 0,

    -- Storage Footprint
    total_output_seconds    NUMERIC(12,2)   NOT NULL DEFAULT 0.00,
    storage_used_bytes      BIGINT          NOT NULL DEFAULT 0,

    -- Rate Limiting Support
    generations_this_month  INTEGER         NOT NULL DEFAULT 0,
    last_reset_at           TIMESTAMPTZ     NOT NULL DEFAULT date_trunc('month', NOW()),

    -- Audit
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```

**Scalability Notes**:
- Counters are updated via `UPDATE ... SET counter = counter + 1` within the same DB transaction as the insert — guaranteed consistent.
- `generations_this_month` + `last_reset_at` supports a monthly rate-limit check at O(1) cost without hitting `generation_history`.
- Introducing a paid tier requires only adding a `plan_type ENUM` column via Alembic — no join table restructuring.

---

## SQLAlchemy Trigger (Auto-Update `updated_at`)

A single reusable trigger function is applied to all tables with an `updated_at` column to automatically maintain the timestamp on any update.

```sql
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_voice_profiles
    BEFORE UPDATE ON voice_profiles
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_generation_history
    BEFORE UPDATE ON generation_history
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_usage_stats
    BEFORE UPDATE ON user_usage_stats
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
```

---

## Alembic Migration Strategy

| Convention | Detail |
|-----------|--------|
| **Baseline** | Initial migration creates all enums, tables, indexes, and triggers |
| **Naming** | `YYYYMMDD_HHMMSS_short_description.py` — chronologically sortable |
| **Rollback** | Every migration must implement a `downgrade()` function |
| **Zero Downtime** | Additive changes only (new columns with defaults, new tables) — never rename or drop in a single migration |
| **Column Additions** | New columns always carry `server_default` and `nullable=True` first; constraints tightened in a follow-up migration |

---

## Index Coverage for Core API Queries

| API Endpoint | Query Pattern | Index Used |
|-------------|--------------|-----------|
| `GET /dashboard` — list voice profiles | `WHERE user_id = ? AND deleted_at IS NULL` | `idx_voice_profiles_user_status` |
| `GET /voices/:id` — generation history | `WHERE user_id = ? ORDER BY created_at DESC` | `idx_gen_history_user_id` |
| `GET /generation/:task_id` — task polling | `WHERE celery_task_id = ?` | `idx_gen_history_celery_task` |
| `GET /profile` — usage stats | `WHERE user_id = ?` (PK lookup) | PK index on `user_usage_stats` |
| Firebase auth middleware | `WHERE firebase_uid = ?` | `idx_users_firebase_uid` |

---

## Future Scalability Additions (Post v1.0)

| Feature | Required Schema Change |
|---------|----------------------|
| **Paid Subscription Tier** | Add `plan_type ENUM ('free', 'pro', 'enterprise')` + `subscription_expires_at` to `users` |
| **Voice Sharing / Marketplace** | New `shared_voices` table with FK to `voice_profiles` + `is_public BOOLEAN` flag |
| **Multi-Language Support** | Add `language_code VARCHAR(10)` column to `generation_history` |
| **Team / Org Accounts** | New `organizations` + `org_members` junction tables; add `org_id` FK to `voice_profiles` |
| **Webhook Notifications** | New `webhooks` table (user_id, target_url, event_types[]) |

> All additions are purely additive — the v1.0 schema is designed so no existing table requires restructuring for any of the above features.
