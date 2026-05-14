-- ==================================================================
-- Migration: 004_create_vault_system.down.sql
-- ==================================================================

DROP TABLE IF EXISTS vault_items CASCADE;
DROP TABLE IF EXISTS vault_collections CASCADE;