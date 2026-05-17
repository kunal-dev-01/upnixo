// ─────────────────────────────────────────────────────────────────────────────
// hooks/useVault.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vaultService } from "@/services/vault.service";
import type { ApiError } from "@/types/api.types";
import type {
  CreateVaultCollectionPayload,
  UpdateVaultCollectionPayload,
  CreateVaultItemPayload,
  UpdateVaultItemPayload,
} from "@/types/vault.types";

export const vaultKeys = {
  all: ["vault"] as const,
  collections: () => [...vaultKeys.all, "collections"] as const,
  collectionsByProject: (projectId: string) => [...vaultKeys.collections(), projectId] as const,
  collectionDetails: (id: string) => [...vaultKeys.collections(), "detail", id] as const,
  items: () => [...vaultKeys.all, "items"] as const,
  itemsByCollection: (collectionId: string) => [...vaultKeys.items(), collectionId] as const,
  itemDetails: (id: string) => [...vaultKeys.items(), "detail", id] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function useProjectVaultCollections(projectId: string) {
  const query = useQuery({
    queryKey: vaultKeys.collectionsByProject(projectId),
    queryFn: () => vaultService.listCollectionsByProject(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  return {
    collections: query.data ?? [],
    ...query,
    error: query.error as ApiError | null,
  };
}

export function useVaultCollection(id: string) {
  const query = useQuery({
    queryKey: vaultKeys.collectionDetails(id),
    queryFn: () => vaultService.getCollection(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

  return {
    collection: query.data,
    ...query,
    error: query.error as ApiError | null,
  };
}

export function useCreateVaultCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVaultCollectionPayload) => vaultService.createCollection(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.collectionsByProject(variables.project_id) });
    },
  });
}

export function useUpdateVaultCollection(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVaultCollectionPayload }) =>
      vaultService.updateCollection(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.collectionDetails(variables.id) });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: vaultKeys.collectionsByProject(projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: vaultKeys.collections() });
      }
    },
  });
}

export function useDeleteVaultCollection(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vaultService.deleteCollection(id),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: vaultKeys.collectionsByProject(projectId) });
      } else {
        queryClient.invalidateQueries({ queryKey: vaultKeys.collections() });
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEMS
// ─────────────────────────────────────────────────────────────────────────────

export function useVaultItems(collectionId: string) {
  const query = useQuery({
    queryKey: vaultKeys.itemsByCollection(collectionId),
    queryFn: () => vaultService.listItemsByCollection(collectionId),
    enabled: !!collectionId,
    staleTime: 60 * 1000,
  });

  return {
    items: query.data ?? [],
    ...query,
    error: query.error as ApiError | null,
  };
}

export function useVaultItem(id: string) {
  const query = useQuery({
    queryKey: vaultKeys.itemDetails(id),
    queryFn: () => vaultService.getItem(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

  return {
    item: query.data,
    ...query,
    error: query.error as ApiError | null,
  };
}

export function useCreateVaultItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVaultItemPayload) => vaultService.createItem(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.itemsByCollection(variables.collection_id) });
    },
  });
}

export function useUpdateVaultItem(collectionId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVaultItemPayload }) =>
      vaultService.updateItem(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vaultKeys.itemDetails(variables.id) });
      if (collectionId) {
        queryClient.invalidateQueries({ queryKey: vaultKeys.itemsByCollection(collectionId) });
      } else {
        queryClient.invalidateQueries({ queryKey: vaultKeys.items() });
      }
    },
  });
}

export function useDeleteVaultItem(collectionId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => vaultService.deleteItem(id),
    onSuccess: () => {
      if (collectionId) {
        queryClient.invalidateQueries({ queryKey: vaultKeys.itemsByCollection(collectionId) });
      } else {
        queryClient.invalidateQueries({ queryKey: vaultKeys.items() });
      }
    },
  });
}
