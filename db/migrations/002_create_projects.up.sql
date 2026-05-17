-- ==================================================================
-- Migration: 002_create_projects.up.sql
-- ==================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. ENUMS (State Machine for Projects)
-- ───────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        CREATE TYPE project_status AS ENUM (
            'draft',            -- Initial state
            'active',           -- Work in progress
            'in_review',        -- Waiting for client approval
            'completed',        -- Finished and paid
            'cancelled',        -- Terminated
            'disputed'          -- Logic for conflict resolution
        );
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: projects
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE projects (
    -- ── Identity ────────────────────────────────────────────────────
    id                              UUID            NOT NULL DEFAULT gen_random_uuid(),
    slug                            VARCHAR(100)    NOT NULL, -- URL-friendly identifier

    -- ── Relationships ───────────────────────────────────────────────
    client_id                       UUID            NOT NULL, -- The one paying
    freelancer_id                   UUID,             -- The one working (You or a Partner)
    
    -- ── Real-time & Sync ────────────────────────────────────────────
    chat_room_id                    VARCHAR(128)    UNIQUE,   -- MongoDB/Socket Room Reference
    repository_url                  TEXT,                     -- Version Control Link

    -- ── Core Content ────────────────────────────────────────────────
    title                           VARCHAR(255)    NOT NULL,
    description                     TEXT            NOT NULL,
    requirements_meta               JSONB           NOT NULL DEFAULT '{}', -- Technical Specs

    -- ── Financials ──────────────────────────────────────────────────
    budget                          DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
    currency                        CHAR(3)         NOT NULL DEFAULT 'INR',
    is_escrow_funded                BOOLEAN         NOT NULL DEFAULT FALSE,

    -- ── Status & Priority ───────────────────────────────────────────
    status                          project_status  NOT NULL DEFAULT 'draft',
    priority                        SMALLINT        NOT NULL DEFAULT 0, -- 0:Normal, 1:High, 2:Urgent

    -- ── Denormalized for Performance ────────────────────────────────
    last_activity_at                TIMESTAMPTZ,
    last_message_preview            VARCHAR(255),

    -- ── Timestamps ──────────────────────────────────────────────────
    deadline_at                     TIMESTAMPTZ,
    started_at                      TIMESTAMPTZ,
    completed_at                    TIMESTAMPTZ,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at                      TIMESTAMPTZ,    -- Soft Delete

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT projects_slug_unique UNIQUE (slug),
    CONSTRAINT fk_project_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_freelancer FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_hiring CHECK (client_id <> freelancer_id),
    CONSTRAINT chk_positive_budget CHECK (budget >= 0)
);

-- ───────────────────────────────────────────────────────────────────
-- 3. INDEXES (Optimized for Dashboard Reads)
-- ───────────────────────────────────────────────────────────────────

-- Fast lookup for both parties (Client & Freelancer)
CREATE INDEX idx_projects_client_id ON projects (client_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_freelancer_id ON projects (freelancer_id) WHERE deleted_at IS NULL;

-- Fast sorting by activity (Inbox style)
CREATE INDEX idx_projects_activity ON projects (last_activity_at DESC NULLS LAST) WHERE deleted_at IS NULL;

-- Slug lookup for clean URLs
CREATE INDEX idx_projects_slug ON projects (slug) WHERE deleted_at IS NULL;

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();