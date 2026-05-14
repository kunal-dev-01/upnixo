-- ==================================================================
-- Migration: 003_create_milestones.up.sql
-- ==================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. ENUMS FOR MILESTONE STATE
-- ───────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'milestone_status') THEN
        CREATE TYPE milestone_status AS ENUM (
            'pending_funding',  -- Milestone defined, waiting for client to deposit money
            'funded',           -- Money is in Escrow (Locked)
            'in_review',        -- Freelancer has submitted work
            'approved',         -- Client approved work, payment pending release
            'released',         -- Money sent to Freelancer (Finalized)
            'cancelled'         -- Milestone discarded
        );
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: milestones
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE milestones (
    -- Identity
    id                              UUID            NOT NULL DEFAULT gen_random_uuid(),
    project_id                      UUID            NOT NULL,
    
    -- Structure & Content
    order_index                     SMALLINT        NOT NULL, -- 1, 2, 3... (Sequence)
    title                           VARCHAR(255)    NOT NULL,
    description                     TEXT,
    
    -- Financials (High Precision)
    amount                          DECIMAL(15, 2)  NOT NULL,
    status                          milestone_status NOT NULL DEFAULT 'pending_funding',

    -- External Integrations (Paddle/Payments)
    -- Transaction ID jab client pay karega (Escrow In)
    payment_escrow_id               VARCHAR(255), 
    -- Transaction ID jab freelancer ko paisa jayega (Payout Out)
    payment_release_id              VARCHAR(255), 

    -- Delivery & Proof of Work
    -- Yahan file links, messages ya delivery details JSON mein aayenge
    submission_meta                 JSONB           NOT NULL DEFAULT '{}',

    -- Timestamps for Audit
    due_date                        TIMESTAMPTZ,
    submitted_at                    TIMESTAMPTZ,
    approved_at                     TIMESTAMPTZ,
    paid_at                         TIMESTAMPTZ,
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT milestones_pkey PRIMARY KEY (id),
    CONSTRAINT fk_milestone_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT chk_positive_amount CHECK (amount > 0),
    -- Ensure order_index is valid
    CONSTRAINT chk_order_index CHECK (order_index > 0)
);

-- ───────────────────────────────────────────────────────────────────
-- 3. INDEXES FOR PERFORMANCE
-- ───────────────────────────────────────────────────────────────────

-- Fast lookup for project board (Very common query)
CREATE INDEX idx_milestones_project_id_order ON milestones (project_id, order_index);

-- Payment status auditing (Admin/Finance lookups)
CREATE INDEX idx_milestones_status ON milestones (status);

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_milestones_updated_at
    BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON COLUMN milestones.submission_meta IS 'Stores proof of work, links, and delivery notes in JSONB.';
COMMENT ON COLUMN milestones.payment_escrow_id IS 'External reference for Paddle payment into the platform.';