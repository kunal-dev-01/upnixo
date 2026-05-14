-- ===========================================================================
-- Migrations: 012_create_client_stats.up.sql
-- ===========================================================================

-- ───────────────────────────────────────────────────────────────────
-- TABLE: client_stats
-- Denormalized table for lightning-fast dashboard loads
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE client_stats (
    -- ── Identity (1-to-1 relationship with users table) ─────────────
    client_id                       UUID            NOT NULL,

    -- ── Financial Stats ─────────────────────────────────────────────
    -- Total money client has successfully paid you (Sum from payments_ledger)
    total_spent                     DECIMAL(15, 2)  NOT NULL DEFAULT 0.00,
    
    -- ── Project Stats ───────────────────────────────────────────────
    active_projects_count           INT             NOT NULL DEFAULT 0,
    completed_projects_count        INT             NOT NULL DEFAULT 0,
    
    -- ── Subscription & Task Stats ───────────────────────────────────
    active_subscriptions_count      INT             NOT NULL DEFAULT 0,
    open_tasks_count                INT             NOT NULL DEFAULT 0,   -- todo, in_progress, in_review
    completed_tasks_count           INT             NOT NULL DEFAULT 0,

    -- ── Engagement ──────────────────────────────────────────────────
    last_login_at                   TIMESTAMPTZ,
    last_activity_at                TIMESTAMPTZ,    -- Last time they commented/paid/created a project

    -- ── Timestamps ──────────────────────────────────────────────────
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT client_stats_pkey PRIMARY KEY (client_id),
    CONSTRAINT fk_stats_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Sanity Checks
    CONSTRAINT chk_spent_positive CHECK (total_spent >= 0),
    CONSTRAINT chk_counts_positive CHECK (
        active_projects_count >= 0 AND 
        completed_projects_count >= 0 AND 
        active_subscriptions_count >= 0 AND 
        open_tasks_count >= 0 AND 
        completed_tasks_count >= 0
    )
);

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_client_stats_updated_at
    BEFORE UPDATE ON client_stats
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE client_stats IS 'Pre-aggregated metrics for instant dashboard rendering. Updated asynchronously.';