-- ===========================================================================
-- Migrations: 009_create_payments_ledger.up.sql
-- ===========================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. ENUMS FOR LEDGER
-- ───────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ledger_transaction_type') THEN
        CREATE TYPE ledger_transaction_type AS ENUM (
            'milestone_payment',    -- One-time project payment
            'subscription_charge',  -- Recurring retainer fee
            'refund'                -- Money returned to client
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ledger_status') THEN
        CREATE TYPE ledger_status AS ENUM (
            'processing',           -- Webhook received but pending verification
            'completed',            -- Successfully paid
            'failed',               -- Card declined / Error
            'refunded'              -- Fully refunded
        );
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: payments_ledger
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE payments_ledger (
    -- ── Identity ────────────────────────────────────────────────────
    id                              UUID                    NOT NULL DEFAULT gen_random_uuid(),
    
    -- ── The Payer ───────────────────────────────────────────────────
    client_id                       UUID                    NOT NULL,

    -- ── Source Tracking (Nullable: Transaction kahan se aayi?) ──────
    project_id                      UUID,                   -- Context ke liye
    milestone_id                    UUID,                   -- If its a milestone payment
    subscription_id                 UUID,                   -- If its a subscription payment

    -- ── External Payment Gateway (Paddle) ───────────────────────────
    paddle_transaction_id           VARCHAR(128)            NOT NULL,
    paddle_customer_id              VARCHAR(128),

    -- ── Financials (High Precision) ─────────────────────────────────
    amount                          DECIMAL(15, 2)          NOT NULL, -- How much client paid
    fee_amount                      DECIMAL(15, 2)          NOT NULL DEFAULT 0.00, -- Paddle's processing fee
    net_amount                      DECIMAL(15, 2)          NOT NULL, -- How much you actually receive (amount - fee)
    currency                        CHAR(3)                 NOT NULL DEFAULT 'USD',

    -- ── Transaction Details ─────────────────────────────────────────
    transaction_type                ledger_transaction_type NOT NULL,
    status                          ledger_status           NOT NULL DEFAULT 'completed',

    -- ── Timestamps ──────────────────────────────────────────────────
    created_at                      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT payments_ledger_pkey PRIMARY KEY (id),
    CONSTRAINT fk_ledger_client FOREIGN KEY (client_id) REFERENCES users(id),
    
    -- Optional Foreign Keys (Set to SET NULL to avoid deleting ledger if a project is deleted)
    CONSTRAINT fk_ledger_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_ledger_milestone FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL,
    CONSTRAINT fk_ledger_subscription FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE SET NULL,

    -- Webhooks idempotency 
    CONSTRAINT unique_paddle_transaction UNIQUE (paddle_transaction_id),
    
    -- Math sanity check
    CONSTRAINT chk_net_amount CHECK (net_amount <= amount)
);

-- ───────────────────────────────────────────────────────────────────
-- 3. INDEXES (Optimized for Revenue Dashboard)
-- ───────────────────────────────────────────────────────────────────

-- Fast chart generation: "Show me this month's revenue"
CREATE INDEX idx_ledger_created_at 
    ON payments_ledger (created_at DESC);

-- Client's billing history lookup
CREATE INDEX idx_ledger_client 
    ON payments_ledger (client_id, created_at DESC);

-- Fast lookup to prevent duplicate Webhook processing
CREATE INDEX idx_ledger_paddle_tx 
    ON payments_ledger (paddle_transaction_id);

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_payments_ledger_updated_at
    BEFORE UPDATE ON payments_ledger
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE payments_ledger IS 'Master ledger for all financial transactions (Milestones & Subscriptions).';
COMMENT ON COLUMN payments_ledger.net_amount IS 'The actual profit after Paddle deducts its gateway fees.';