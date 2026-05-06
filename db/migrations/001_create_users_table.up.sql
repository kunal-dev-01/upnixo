-- ===================================================================
-- Migration  : 001_create_users_table.up.sql
-- ===================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ───────────────────────────────────────────────────────────────────

CREATE TYPE oauth_provider AS ENUM (
    'google',
    'github'
);

CREATE TYPE two_factor_method AS ENUM (
    'totp',
    'backup_code'
);

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: users
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
    -- ── Identity ────────────────────────────────────────────────────
    id                              UUID        NOT NULL DEFAULT gen_random_uuid(),

    -- ── Contact ─────────────────────────────────────────────────────
    email                           CITEXT      NOT NULL,
    email_verified                  BOOLEAN     NOT NULL DEFAULT FALSE,
    email_verified_at               TIMESTAMPTZ,
    -- Verify token lives in Redis → email_verify:{user_id}  TTL: 24h

    phone                           VARCHAR(20),
    phone_verified                  BOOLEAN     NOT NULL DEFAULT FALSE,
    phone_verified_at               TIMESTAMPTZ,

    -- ── Auth ────────────────────────────────────────────────────────
    -- NULL for pure-OAuth users who never set a password
    password_hash                   TEXT,
    password_changed_at             TIMESTAMPTZ,
    -- Reset token lives in Redis → pwd_reset:{user_id}  TTL: 15m
    password_reset_requested_at     TIMESTAMPTZ,

    -- ── Profile ─────────────────────────────────────────────────────
    full_name                       VARCHAR(200) NOT NULL DEFAULT '',
    avatar_url                      TEXT,

    -- ── Locale / Preferences ────────────────────────────────────────
    timezone                        VARCHAR(64) NOT NULL DEFAULT 'UTC',
    locale                          VARCHAR(10) NOT NULL DEFAULT 'en',

    -- ── Account State ───────────────────────────────────────────────
    is_active                       BOOLEAN     NOT NULL DEFAULT TRUE,
    is_blocked                      BOOLEAN     NOT NULL DEFAULT FALSE,
    blocked_at                      TIMESTAMPTZ,
    blocked_reason                  TEXT,

    -- ── Security / Audit ────────────────────────────────────────────
    last_login_at                   TIMESTAMPTZ,
    last_login_ip                   INET,
    -- Session + refresh tokens live in Redis:
    --   session:{session_id}           TTL: 15m
    --   refresh:{user_id}:{family_id}  TTL: 30d

    -- ── 2FA (denormalised for fast auth-flow reads, detail in two_factor_auth) ──
    two_factor_enabled              BOOLEAN     NOT NULL DEFAULT FALSE,
    two_factor_enabled_at           TIMESTAMPTZ,

    -- ── Timestamps ──────────────────────────────────────────────────
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at                      TIMESTAMPTZ,

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT users_pkey
        PRIMARY KEY (id),
    CONSTRAINT users_email_unique
        UNIQUE (email),
    CONSTRAINT users_phone_unique
        UNIQUE (phone),
    CONSTRAINT chk_email_verified_at
        CHECK (email_verified = FALSE OR email_verified_at IS NOT NULL),
    CONSTRAINT chk_phone_verified_at
        CHECK (phone_verified = FALSE OR phone_verified_at IS NOT NULL),
    CONSTRAINT chk_2fa_enabled_at
        CHECK (two_factor_enabled = FALSE OR two_factor_enabled_at IS NOT NULL),
    CONSTRAINT chk_blocked_at
        CHECK (is_blocked = FALSE OR blocked_at IS NOT NULL),
    CONSTRAINT chk_phone_format
        CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{6,14}$')
);

-- ── Indexes ──────────────────────────────────────────────────────────

-- Email login lookup
CREATE INDEX idx_users_email
    ON users (email)
    WHERE deleted_at IS NULL;

-- Session validation hot path
CREATE INDEX idx_users_active
    ON users (id)
    WHERE is_active = TRUE
      AND is_blocked = FALSE
      AND deleted_at IS NULL;

-- Soft-delete admin / cleanup queries
CREATE INDEX idx_users_deleted_at
    ON users (deleted_at)
    WHERE deleted_at IS NOT NULL;

-- Phone OTP flows
CREATE INDEX idx_users_phone
    ON users (phone)
    WHERE phone IS NOT NULL
      AND deleted_at IS NULL;

-- Stale-account cleanup / analytics
CREATE INDEX idx_users_last_login_at
    ON users (last_login_at DESC NULLS LAST)
    WHERE deleted_at IS NULL;

-- Security audits / 2FA enforcement policies
CREATE INDEX idx_users_2fa_enabled
    ON users (id)
    WHERE two_factor_enabled = TRUE
      AND deleted_at IS NULL;

-- ── Trigger ──────────────────────────────────────────────────────────
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE  users                                 IS 'Core user identity table.';
COMMENT ON COLUMN users.password_hash                   IS 'NULL for pure-OAuth accounts. Hash computed server-side before INSERT.';
COMMENT ON COLUMN users.password_reset_requested_at     IS 'Timestamp only. Token lives in Redis (pwd_reset:{user_id}, TTL 15m).';
COMMENT ON COLUMN users.email_verified_at               IS 'Set when Redis email-verify token is consumed.';
COMMENT ON COLUMN users.two_factor_enabled              IS 'Denormalised from two_factor_auth for fast reads without JOIN.';
COMMENT ON COLUMN users.deleted_at                      IS 'Soft delete. Always filter WHERE deleted_at IS NULL in app queries.';
COMMENT ON COLUMN users.last_login_ip                   IS 'INET stores both IPv4 and IPv6 natively.';
COMMENT ON COLUMN users.phone                           IS 'E.164 format enforced by constraint. e.g. +919876543210';

-- ───────────────────────────────────────────────────────────────────
-- 3. TABLE: oauth_accounts
--    One row per (user × provider).
--    A user can link both Google AND GitHub simultaneously.
--    Unlinking = DELETE the row.
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE oauth_accounts (
    id                  UUID            NOT NULL DEFAULT gen_random_uuid(),
    user_id             UUID            NOT NULL,

    -- ── Provider Identity ───────────────────────────────────────────
    provider            oauth_provider  NOT NULL,
    provider_user_id    VARCHAR(255)    NOT NULL,
    provider_email      CITEXT,
    provider_name       VARCHAR(200),
    provider_avatar_url TEXT,

    -- ── Scopes & Raw Payload ────────────────────────────────────────
    scopes              TEXT[],
    provider_meta       JSONB           NOT NULL DEFAULT '{}',

    -- ── Timestamps ──────────────────────────────────────────────────
    connected_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    last_used_at        TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT oauth_accounts_pkey
        PRIMARY KEY (id),
    CONSTRAINT oauth_accounts_provider_uid_unique
        UNIQUE (provider, provider_user_id),
    CONSTRAINT oauth_accounts_user_provider_unique
        UNIQUE (user_id, provider),
    CONSTRAINT fk_oauth_accounts_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

-- ── Indexes ──────────────────────────────────────────────────────────

-- OAuth callback hot path
CREATE INDEX idx_oauth_provider_uid
    ON oauth_accounts (provider, provider_user_id);

-- List providers linked to a user (profile page)
CREATE INDEX idx_oauth_user_id
    ON oauth_accounts (user_id);

-- ── Trigger ──────────────────────────────────────────────────────────
CREATE TRIGGER trg_oauth_accounts_updated_at
    BEFORE UPDATE ON oauth_accounts
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE  oauth_accounts                    IS 'OAuth provider links per user. Access/refresh tokens NOT stored — managed in Redis.';
COMMENT ON COLUMN oauth_accounts.provider_user_id   IS 'Stable ID from provider (Google sub / GitHub id). Never changes.';
COMMENT ON COLUMN oauth_accounts.provider_meta      IS 'Raw JSON from provider userinfo endpoint for future enrichment.';
COMMENT ON COLUMN oauth_accounts.scopes             IS 'OAuth scopes granted at last consent. e.g. {email, profile}';

-- ───────────────────────────────────────────────────────────────────
-- 4. TABLE: two_factor_auth
--    One row per user.
--    TOTP secret must be encrypted at application layer before INSERT.
--    Backup codes stored as server-side hashes (argon2id / bcrypt).
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE two_factor_auth (
    id                          UUID                NOT NULL DEFAULT gen_random_uuid(),
    user_id                     UUID                NOT NULL,

    -- ── TOTP ────────────────────────────────────────────────────────
    -- Encrypt with AES-256 server-side before storing
    totp_secret                 TEXT                NOT NULL,
    totp_algorithm              VARCHAR(10)         NOT NULL DEFAULT 'SHA1',
    totp_digits                 SMALLINT            NOT NULL DEFAULT 6,
    totp_period                 SMALLINT            NOT NULL DEFAULT 30,

    -- ── Backup Codes ────────────────────────────────────────────────
    -- Array of server-hashed one-time recovery codes (8–10 typical)
    -- App removes consumed code from array on use
    backup_codes                TEXT[]              NOT NULL DEFAULT '{}',
    backup_codes_generated_at   TIMESTAMPTZ,

    -- ── State ───────────────────────────────────────────────────────
    is_enabled                  BOOLEAN             NOT NULL DEFAULT FALSE,
    -- 2FA setup verify token lives in Redis → 2fa_setup:{user_id}  TTL: 10m
    enabled_at                  TIMESTAMPTZ,
    last_verified_at            TIMESTAMPTZ,
    last_method_used            two_factor_method,

    -- ── Timestamps ──────────────────────────────────────────────────
    created_at                  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    -- ── Constraints ─────────────────────────────────────────────────
    CONSTRAINT two_factor_auth_pkey
        PRIMARY KEY (id),
    CONSTRAINT two_factor_auth_user_unique
        UNIQUE (user_id),
    CONSTRAINT fk_2fa_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT chk_totp_digits
        CHECK (totp_digits IN (6, 8)),
    CONSTRAINT chk_totp_period
        CHECK (totp_period IN (30, 60)),
    CONSTRAINT chk_enabled_at
        CHECK (is_enabled = FALSE OR enabled_at IS NOT NULL)
);

-- ── Indexes ──────────────────────────────────────────────────────────

-- Auth flow lookup — only index enabled rows
CREATE INDEX idx_2fa_user_id
    ON two_factor_auth (user_id)
    WHERE is_enabled = TRUE;

-- ── Trigger ──────────────────────────────────────────────────────────
CREATE TRIGGER trg_2fa_updated_at
    BEFORE UPDATE ON two_factor_auth
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- ── User Preferences ─────────────────────────────────────────────────
CREATE TABLE user_preferences (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- ── Appearance ──────────────────────────────────────────────────
    theme               VARCHAR(20) NOT NULL DEFAULT 'system', -- 'light', 'dark', 'system'
    sidebar_collapsed   BOOLEAN NOT NULL DEFAULT FALSE,
    compact_view        BOOLEAN NOT NULL DEFAULT FALSE,

    -- ── Notification Settings (Granular Control) ─────────────────────
    -- JSONB best hai flexibility ke liye, indexing ki tension nahi kyunki ye 'hot path' query nahi hai
    -- Isme hum alag alag events track karenge
    notifications       JSONB NOT NULL DEFAULT '{
        "email": {
            "order_updates": true,      -- Naya project start hona ya milestone complete hona
            "chat_messages": true,      -- Aapka bheja hua message
            "billing_invoices": true,   -- Invoice generate hone par
            "marketing": false          -- Promotion/Offers
        },
        "push": {
            "mentions": true,
            "direct_messages": true,
            "security_alerts": true
        }
    }'::jsonb,

    -- ── Freelance/Business Specific ─────────────────────────────────
    default_currency    CHAR(3) NOT NULL DEFAULT 'INR', -- Aap India se ho toh default INR rakh sakte ho
    language            VARCHAR(10) NOT NULL DEFAULT 'en',

    -- ── Timestamps ──────────────────────────────────────────────────
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);    

-- ── Trigger for updated_at ──────────────────────────────────────────
CREATE TRIGGER trg_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── Comments ─────────────────────────────────────────────────────────
COMMENT ON TABLE  two_factor_auth               IS 'TOTP-based 2FA config. Secret encrypted server-side before INSERT.';
COMMENT ON COLUMN two_factor_auth.totp_secret   IS 'AES-256 encrypted TOTP base32 secret. Decrypt only on verify.';
COMMENT ON COLUMN two_factor_auth.backup_codes  IS 'Server-hashed recovery codes. App removes consumed codes atomically.';
COMMENT ON COLUMN user_preferences.notifications IS 'Granular notification settings for Email and Push in JSONB format.';

-- ===================================================================
-- END OF MIGRATION
-- ===================================================================