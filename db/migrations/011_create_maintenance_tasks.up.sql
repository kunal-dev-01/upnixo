-- ===========================================================================
-- Migrations: 011_create_maintenance_tasks.up.sql
-- ===========================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. ENUMS FOR TASK WORKFLOW
-- ───────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM (
            'todo',             -- Client raised the request
            'in_progress',      -- You are actively working on it
            'in_review',        -- Waiting for client feedback
            'completed',        -- Task finished successfully
            'cancelled'         -- Task dropped or out of scope
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
        CREATE TYPE task_priority AS ENUM (
            'low',
            'medium',
            'high',
            'urgent'            -- Critical bugs or server down
        );
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: maintenance_tasks
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE maintenance_tasks (
    -- ── Identity ────────────────────────────────────────────────────
    id                              UUID            NOT NULL DEFAULT gen_random_uuid(),
    
    -- ── Relationships ───────────────────────────────────────────────
    -- Links to the active retainer plan
    subscription_id                 UUID            NOT NULL,
    -- Denormalized for faster client dashboard rendering
    client_id                       UUID            NOT NULL,

    -- ── Core Content ────────────────────────────────────────────────
    title                           VARCHAR(255)    NOT NULL,
    description                     TEXT,           -- Can store Markdown content from client
    
    -- ── State Management ────────────────────────────────────────────
    status                          task_status     NOT NULL DEFAULT 'todo',
    priority                        task_priority   NOT NULL DEFAULT 'medium',

    -- ── Time & Effort Tracking (Crucial for profitability) ──────────
    -- How many hours you expect it to take vs how many it actually took
    estimated_hours                 DECIMAL(5, 2),
    logged_hours                    DECIMAL(5, 2)   NOT NULL DEFAULT 0.00,

    -- ── Timestamps ──────────────────────────────────────────────────
    due_date                        TIMESTAMPTZ,
    started_at                      TIMESTAMPTZ,
    completed_at                    TIMESTAMPTZ,
    
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT maintenance_tasks_pkey PRIMARY KEY (id),
    CONSTRAINT fk_task_subscription FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Prevent negative time tracking
    CONSTRAINT chk_logged_hours CHECK (logged_hours >= 0),
    CONSTRAINT chk_estimated_hours CHECK (estimated_hours IS NULL OR estimated_hours >= 0)
);

-- ───────────────────────────────────────────────────────────────────
-- 3. INDEXES (Optimized for Kanban Board Generation)
-- ───────────────────────────────────────────────────────────────────

-- Fast load for the Client's active tasks board
CREATE INDEX idx_tasks_client_status 
    ON maintenance_tasks (client_id, status) 
    WHERE status != 'completed' AND status != 'cancelled';

-- Fast load for Your (Admin) active queue, sorted by priority
CREATE INDEX idx_tasks_priority_queue 
    ON maintenance_tasks (status, priority DESC, created_at ASC)
    WHERE status IN ('todo', 'in_progress', 'in_review');

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_maintenance_tasks_updated_at
    BEFORE UPDATE ON maintenance_tasks
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE maintenance_tasks IS 'Ticketing system for managing operational requests within an active subscription.';
COMMENT ON COLUMN maintenance_tasks.logged_hours IS 'Helps the freelancer audit if a retainer client is profitable or draining resources.';