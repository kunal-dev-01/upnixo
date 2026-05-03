-- ===================================================================
-- Description: 000_enable_extentions.up.sql
-- ===================================================================
-- This migration enables the required extensions for the database.

CREATE EXTENSION IF NOT EXISTS "citext";

-- ==================================================================
-- SHARED UPDATE FUNCTION 
-- ==================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW IS DISTINCT FROM OLD THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;    