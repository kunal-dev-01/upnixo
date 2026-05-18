// ─────────────────────────────────────────────────────────────────────────────
// hooks/useUser.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import type { ApiError } from "@/types/api.types";
import type { UserFilters } from "@/types/user.types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  listAdmin: (filters?: UserFilters) =>
    [...userKeys.lists(), "admin", filters] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// FETCH USERS (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminUsers(filters?: UserFilters) {
  const query = useQuery({
    queryKey: userKeys.listAdmin(filters),
    queryFn: () => userService.listAll(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    data: query.data,
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK USER (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────

export function useBlockUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      userService.block(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });

  return {
    blockUser: mutation.mutate,
    blockUserAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    reset: mutation.reset,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UNBLOCK USER (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────

export function useUnblockUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => userService.unblock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });

  return {
    unblockUser: mutation.mutate,
    unblockUserAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    reset: mutation.reset,
  };
}
