-- ===================================================================
-- Description: 000_enable_extentions.down.sql
-- ===================================================================
-- This migration is irreversible, as it drops extensions that may be in use.

DROP EXTENSION IF EXISTS "citext";
DROP FUNCTION IF EXISTS fn_set_updated_at();