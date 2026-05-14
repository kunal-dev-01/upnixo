-- ==================================================================
-- Migration: 004_create_vault_system.up.sql
-- ==================================================================

-- ───────────────────────────────────────────────────────────────────
-- 1. TABLE: vault_collections
--    Groups related secrets together (e.g., "AWS Config", "Staging DB")
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE vault_collections (
    id                              UUID            NOT NULL DEFAULT gen_random_uuid(),
    project_id                      UUID            NOT NULL,
    name                            VARCHAR(100)    NOT NULL, -- User defined (e.g., "Production Env")
    description                     TEXT,
    
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT vault_collections_pkey PRIMARY KEY (id),
    CONSTRAINT fk_vault_coll_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ───────────────────────────────────────────────────────────────────
-- 2. TABLE: vault_items
--    The actual Key-Value pairs inside a collection
-- ───────────────────────────────────────────────────────────────────
CREATE TABLE vault_items (
    id                              UUID            NOT NULL DEFAULT gen_random_uuid(),
    collection_id                   UUID            NOT NULL,
    added_by                        UUID            NOT NULL,

    -- Key Name (e.g., 'DB_PASSWORD')
    key_name                        VARCHAR(128)    NOT NULL,
    
    -- Encryption Details (AES-256-GCM)
    encrypted_value                 TEXT            NOT NULL,
    encryption_iv                   TEXT            NOT NULL, -- Nonce for security
    
    -- Versioning (Advanced feature to track secret rotations)
    version                         INT             NOT NULL DEFAULT 1,
    
    created_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT vault_items_pkey PRIMARY KEY (id),
    CONSTRAINT fk_vault_item_coll FOREIGN KEY (collection_id) REFERENCES vault_collections(id) ON DELETE CASCADE,
    CONSTRAINT fk_vault_item_user FOREIGN KEY (added_by) REFERENCES users(id),
    
    -- Ek hi collection mein duplicate keys nahi honi chahiye
    CONSTRAINT unique_key_per_collection UNIQUE (collection_id, key_name)
);

-- ── Indexes for Speed ───────────────────────────────────────────────
CREATE INDEX idx_vault_items_coll ON vault_items (collection_id);
CREATE INDEX idx_vault_coll_project ON vault_collections (project_id);

-- ── Triggers ────────────────────────────────────────────────────────
CREATE TRIGGER trg_vault_collections_updated_at BEFORE UPDATE ON vault_collections FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_vault_items_updated_at BEFORE UPDATE ON vault_items FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();