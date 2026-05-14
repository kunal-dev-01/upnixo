-- ===========================================================================
-- Migrations: 008_create_maintenance_targets.up.sql
-- ===========================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. ENUMS FOR TARGET TYPE
-- ───────────────────────────────────────────────────────────────────
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_source') THEN
        CREATE TYPE target_source AS ENUM (
            'internal_project', -- Project built by you on this platform
            'external_system'   -- Client's existing website/app
        );
    END IF;
END $$;

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: maintenance_targets
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE maintenance_targets (
    -- ── Identity ────────────────────────────────────────────────────
    id                              UUID            NOT NULL DEFAULT gen_random_uuid(),
    subscription_id                 UUID            NOT NULL,

    -- ── Source Logic ────────────────────────────────────────────────
    source_type                     target_source   NOT NULL,
    
    internal_project_id             UUID,           
    
    external_name                   VARCHAR(255),
    external_live_url               VARCHAR(255),
    external_repo_url               VARCHAR(255),

    -- ── Tech Stack & Instructions (Flexible JSONB) ──────────────────
    -- Example: {"framework": "Astro", "backend": "Go", "db": "PostgreSQL", "hosting": "Hetzner"}
    tech_stack_meta                 JSONB           NOT NULL DEFAULT '{}',
    special_instructions            TEXT,           -- Client ki koi specific demand

    -- ── Security (The Masterstroke) ─────────────────────────────────
    -- Link to vault_collections so client can securely add AWS/SSH keys for external systems
    vault_collection_id             UUID,

    -- ── Timestamps ──────────────────────────────────────────────────
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT maintenance_targets_pkey PRIMARY KEY (id),
    CONSTRAINT fk_target_subscription FOREIGN KEY (subscription_id) REFERENCES client_subscriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_target_internal_proj FOREIGN KEY (internal_project_id) REFERENCES projects(id),
    CONSTRAINT fk_target_vault FOREIGN KEY (vault_collection_id) REFERENCES vault_collections(id),

    -- ── Data Integrity Checks ───────────────────────────────────────
    CONSTRAINT chk_internal_target CHECK (
        (source_type != 'internal_project') OR (internal_project_id IS NOT NULL)
    ),
    CONSTRAINT chk_external_target CHECK (
        (source_type != 'external_system') OR (external_name IS NOT NULL)
    ),
    CONSTRAINT unique_target_per_sub UNIQUE (subscription_id)
);

-- ───────────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_targets_subscription ON maintenance_targets (subscription_id);

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_maintenance_targets_updated_at
    BEFORE UPDATE ON maintenance_targets
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE maintenance_targets IS 'Defines exactly what asset (internal or external) is being maintained under a subscription.';
COMMENT ON COLUMN maintenance_targets.tech_stack_meta IS 'JSONB to store tech stack details without altering schema.';