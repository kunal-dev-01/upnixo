import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user.service";
import { useAuthStore } from "@/store/auth.store";
import type { ApiError } from "@/types/api.types";
import { useEffect } from "react";
import type { UpdatePreferencesPayload, UpdateUserPayload } from "@/types/user.types";

export const userKeys = {
  all: ["user"] as const,
  me: ["user", "me"] as const,
  byId: (id: string) => ["user", "id", id] as const,
  byEmail: (email: string) => ["user", "email", email] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ME
// ─────────────────────────────────────────────────────────────────────────────

export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateUser = useAuthStore((s) => s.updateUserLocally);

  const query = useQuery({
    queryKey: userKeys.me,
    queryFn: userService.getMe,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  useEffect(() => {
    if (query.data) {
      updateUser(query.data);
    }
  }, [query.data, updateUser]);

  return {
    user: query.data,
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const updateUserLocally = useAuthStore((s) => s.updateUserLocally);

  const mutation = useMutation({
    mutationFn: (data: UpdateUserPayload) => userService.updateProfile(data),
    onSuccess: (updatedData) => {
      updateUserLocally(updatedData);
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });

  return {
    updateProfile: mutation.mutate,
    updateProfileAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const updatePrefsLocally = useAuthStore((s) => s.updatePreferencesLocally);

  const mutation = useMutation({
    mutationFn: (data: UpdatePreferencesPayload) => userService.updatePreferences(data),
    onSuccess: (updatedData) => {
      updatePrefsLocally(updatedData);
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });

  return {
    updatePreferences: mutation.mutate,
    updatePreferencesAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  };
}
