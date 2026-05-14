-- ===========================================================================
-- Migrations: 007_create_client_subscriptions.up.sql
-- ===========================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. ENUMS FOR SUBSCRIPTION STATUS (Paddle v2 Standard)
-- ───────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM (
            'active',           -- All good, payment successful
            'past_due',         -- Payment failed, retrying (Grace period)
            'paused',           -- Client or Admin temporarily paused it
            'canceled'          -- Subscription ended
        );
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: client_subscriptions
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE client_subscriptions (
    -- ── Identity ────────────────────────────────────────────────────
    id                              UUID                    NOT NULL DEFAULT gen_random_uuid(),
    
    -- ── Relationships ───────────────────────────────────────────────
    client_id                       UUID                    NOT NULL,
    plan_id                         UUID                    NOT NULL,

    -- ── Paddle v2 Identifiers ───────────────────────────────────────
    paddle_subscription_id          VARCHAR(128)            NOT NULL, -- Crucial for Webhooks
    paddle_customer_id              VARCHAR(128)            NOT NULL, -- To group invoices/payments

    -- ── State Management ────────────────────────────────────────────
    status                          subscription_status     NOT NULL DEFAULT 'active',
    
    -- Current billing cycle khatam hone tak chalta hai.
    cancel_at_period_end            BOOLEAN                 NOT NULL DEFAULT FALSE,

    -- ── Billing Cycle (Timeframe) ───────────────────────────────────
    current_period_start            TIMESTAMPTZ             NOT NULL,
    current_period_end              TIMESTAMPTZ             NOT NULL,

    -- ── Timestamps ──────────────────────────────────────────────────
    canceled_at                     TIMESTAMPTZ,            -- Exact time when cancellation was requested
    created_at                      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT client_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT fk_subscription_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
    
    CONSTRAINT unique_active_plan_per_client UNIQUE (client_id, plan_id, paddle_subscription_id)
);

-- ───────────────────────────────────────────────────────────────────
-- 3. INDEXES (Optimized for Webhooks and Cron Jobs)
-- ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_subscriptions_paddle_id 
    ON client_subscriptions (paddle_subscription_id);

CREATE INDEX idx_subscriptions_period_end 
    ON client_subscriptions (current_period_end) 
    WHERE status = 'active';

-- Client Dashboard load karne ke liye
CREATE INDEX idx_subscriptions_client 
    ON client_subscriptions (client_id, status);

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_client_subscriptions_updated_at
    BEFORE UPDATE ON client_subscriptions
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE client_subscriptions IS 'Tracks active and past retainers/maintenance plans for clients.';
COMMENT ON COLUMN client_subscriptions.cancel_at_period_end IS 'If true, the subscription remains active until current_period_end, then changes to canceled.';