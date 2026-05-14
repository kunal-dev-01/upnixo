-- ===========================================================================
-- Migrations: 005_create_master_admin.up.sql
-- ===========================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. TABLE: master_admins
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE master_admins (
    -- Identity
    id                              UUID            NOT NULL DEFAULT gen_random_uuid(),
    
    -- Contact & Personal Details
    full_name                       VARCHAR(200)    NOT NULL,
    email                           CITEXT          NOT NULL,
    phone                           VARCHAR(20)     NOT NULL,
    
    -- Primary Auth
    password_hash                   TEXT            NOT NULL,
    
    -- Secondary Auth (The Secret Access Key)
    master_secret_key               TEXT            NOT NULL, 

    -- Account Protection Logic
    is_verified                     BOOLEAN         NOT NULL DEFAULT FALSE,
    verification_token_sent_at      TIMESTAMPTZ,
    -- Login Security
    is_active                       BOOLEAN         NOT NULL DEFAULT TRUE,
    
    -- Audit & Security Monitoring
    last_login_at                   TIMESTAMPTZ,
    last_login_ip                   INET,
    last_user_agent                 TEXT,

    -- Timestamps
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    deleted_at                      TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT master_admins_pkey PRIMARY KEY (id),
    CONSTRAINT master_admins_email_unique UNIQUE (email),
    CONSTRAINT master_admins_phone_unique UNIQUE (phone),
    CONSTRAINT master_admins_secret_unique UNIQUE (master_secret_key)
);

-- ───────────────────────────────────────────────────────────────────
-- 2. INDEXES (Optimized for Security Lookups)
-- ───────────────────────────────────────────────────────────────────

-- Email lookup for login (Soft-delete aware)
CREATE INDEX idx_master_admins_email 
    ON master_admins (email) 
    WHERE deleted_at IS NULL AND is_active = TRUE;

-- Fast check for Master Secret Key validation
CREATE INDEX idx_master_admins_secret 
    ON master_admins (master_secret_key) 
    WHERE is_active = TRUE;

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_master_admins_updated_at
    BEFORE UPDATE ON master_admins
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE master_admins IS 'Root administrative accounts with full system access.';
COMMENT ON COLUMN master_admins.master_secret_key IS 'A high-entropy key required for system-level overrides and vault access.';