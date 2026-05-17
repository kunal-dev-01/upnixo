// ─────────────────────────────────────────────────────────────────────────────
// types/vault.types.ts
// ─────────────────────────────────────────────────────────────────────────────

export interface VaultCollection {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface VaultItem {
  id: string;
  collection_id: string;
  added_by: string;
  key_name: string;
  version: number;
  created_at: string;
  value: string; // The decrypted secret value
}

export interface CreateVaultCollectionPayload {
  project_id: string;
  name: string;
  description?: string;
}

export interface UpdateVaultCollectionPayload {
  name?: string;
  description?: string;
}

export interface CreateVaultItemPayload {
  collection_id: string;
  key_name: string;
  value: string;
}

export interface UpdateVaultItemPayload {
  key_name?: string;
  value?: string;
}
