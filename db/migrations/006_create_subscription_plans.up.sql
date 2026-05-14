-- ===========================================================================
-- Migrations: 006_create_subscription_plans.up.sql
-- ===========================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. ENUMS FOR BILLING CYCLE
-- ───────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle') THEN
        CREATE TYPE billing_cycle AS ENUM (
            'weekly',
            'monthly',
            'quarterly',
            'yearly'
        );
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: subscription_plans
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE subscription_plans (
    -- ── Identity ────────────────────────────────────────────────────
    id                              UUID            NOT NULL DEFAULT gen_random_uuid(),
    slug                            VARCHAR(100)    NOT NULL, -- URL friendly (e.g., 'basic-maintenance')
    
    -- ── Content ─────────────────────────────────────────────────────
    name                            VARCHAR(150)    NOT NULL,
    description                     TEXT,
    
    -- UI Rendering Logic (Dynamic Bullet Points)
    -- JSON array of strings e.g., ["Weekly Backups", "20hrs Support", "SSL Renewals"]
    features_list                   JSONB           NOT NULL DEFAULT '[]', 
    
    -- ── Financials ──────────────────────────────────────────────────
    price                           DECIMAL(15, 2)  NOT NULL,
    currency                        CHAR(3)         NOT NULL DEFAULT 'USD',
    cycle                           billing_cycle   NOT NULL DEFAULT 'monthly',

    -- ── Paddle v2 External Identifiers ──────────────────────────────
    paddle_product_id               VARCHAR(128),   -- The Product ID in Paddle
    paddle_price_id                 VARCHAR(128),   -- The specific Price ID (Needed for checkout)

    -- ── State Management ────────────────────────────────────────────
    is_active                       BOOLEAN         NOT NULL DEFAULT TRUE,  -- Active for new users?
    is_featured                     BOOLEAN         NOT NULL DEFAULT FALSE, -- Highlight on pricing page?

    -- ── Timestamps ──────────────────────────────────────────────────
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at                      TIMESTAMPTZ,    -- Soft delete for legacy plans

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT subscription_plans_pkey PRIMARY KEY (id),
    CONSTRAINT subscription_plans_slug_unique UNIQUE (slug),
    CONSTRAINT chk_plan_price CHECK (price >= 0)
);

-- ───────────────────────────────────────────────────────────────────
-- 3. INDEXES (Optimized for Pricing Page Load)
-- ───────────────────────────────────────────────────────────────────

-- Fast lookup for the public pricing page (Only shows active plans)
CREATE INDEX idx_plans_active_public 
    ON subscription_plans (is_active) 
    WHERE deleted_at IS NULL AND is_active = TRUE;

-- Lookup by Paddle Price ID (Crucial for Webhook parsing)
CREATE INDEX idx_plans_paddle_price 
    ON subscription_plans (paddle_price_id) 
    WHERE paddle_price_id IS NOT NULL;

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE subscription_plans IS 'Catalog of maintenance/retainer plans offered to clients.';
COMMENT ON COLUMN subscription_plans.features_list IS 'JSONB array of feature strings for frontend rendering.';
COMMENT ON COLUMN subscription_plans.paddle_price_id IS 'Required to initialize Paddle Checkout on the frontend.';