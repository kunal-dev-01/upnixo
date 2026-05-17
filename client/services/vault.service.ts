// ─────────────────────────────────────────────────────────────────────────────
// services/vault.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/axios";
import type { BackendSuccessResponse } from "@/types/api.types";
import type {
  VaultCollection,
  VaultItem,
  CreateVaultCollectionPayload,
  UpdateVaultCollectionPayload,
  CreateVaultItemPayload,
  UpdateVaultItemPayload,
} from "@/types/vault.types";

export const vaultService = {
  // Collections
  createCollection: async (payload: CreateVaultCollectionPayload): Promise<VaultCollection> => {
    const { data } = await apiClient.post<BackendSuccessResponse<VaultCollection>>("/vault/collections", payload);
    return data.data!;
  },

  getCollection: async (id: string): Promise<VaultCollection> => {
    const { data } = await apiClient.get<BackendSuccessResponse<VaultCollection>>(`/vault/collections/${id}`);
    return data.data!;
  },

  listCollectionsByProject: async (projectId: string): Promise<VaultCollection[]> => {
    const { data } = await apiClient.get<BackendSuccessResponse<VaultCollection[]>>(`/vault/collections/project/${projectId}`);
    return data.data || [];
  },

  updateCollection: async (id: string, payload: UpdateVaultCollectionPayload): Promise<void> => {
    await apiClient.patch(`/vault/collections/${id}`, payload);
  },

  deleteCollection: async (id: string): Promise<void> => {
    await apiClient.delete(`/vault/collections/${id}`);
  },

  // Items
  createItem: async (payload: CreateVaultItemPayload): Promise<VaultItem> => {
    const { data } = await apiClient.post<BackendSuccessResponse<VaultItem>>("/vault/items", payload);
    return data.data!;
  },

  getItem: async (id: string): Promise<VaultItem> => {
    const { data } = await apiClient.get<BackendSuccessResponse<VaultItem>>(`/vault/items/${id}`);
    return data.data!;
  },

  listItemsByCollection: async (collectionId: string): Promise<VaultItem[]> => {
    const { data } = await apiClient.get<BackendSuccessResponse<VaultItem[]>>(`/vault/items/collection/${collectionId}`);
    return data.data || [];
  },

  updateItem: async (id: string, payload: UpdateVaultItemPayload): Promise<void> => {
    await apiClient.patch(`/vault/items/${id}`, payload);
  },

  deleteItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/vault/items/${id}`);
  },
};
