-- ===================================================================
-- Migration  : 001_create_users_table.down.sql
-- ===================================================================

DROP TRIGGER IF EXISTS trg_2fa_updated_at         ON two_factor_auth;
DROP TRIGGER IF EXISTS trg_oauth_accounts_updated_at ON oauth_accounts;
DROP TRIGGER IF EXISTS trg_users_updated_at        ON users;

DROP TABLE IF EXISTS two_factor_auth  CASCADE;
DROP TABLE IF EXISTS oauth_accounts   CASCADE;
DROP TABLE IF EXISTS users            CASCADE;

DROP FUNCTION IF EXISTS trigger_set_updated_at()  CASCADE;

DROP TYPE IF EXISTS two_factor_method CASCADE;
DROP TYPE IF EXISTS oauth_provider    CASCADE;