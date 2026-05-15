import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { ApiError } from "@/types/api.types";
import type {
  AdminLoginRequest,
  AdminVerifyRequest,
  AdminResetPasswordRequest,
  AdminResetMasterKeyRequest,
} from "@/types/auth.types";

export const authKeys = {
  sessions: ["auth", "admin", "sessions"] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN & VERIFY
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminLogin() {
  return useMutation({
    mutationFn: (data: AdminLoginRequest) => authService.login(data),
  });
}

export function useAdminVerify() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: AdminVerifyRequest) => authService.verifyLogin(data),
    onSuccess: (data) => {
      setAuth(data.admin, data.access_token);
      router.replace("/dashboard");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  const router = useRouter();

  const cleanup = () => {
    clearAuth();
    queryClient.clear();
    router.replace("/auth/login");
  };

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: cleanup,
    onError: cleanup, // Clear local state even if server fails
  });
}

export function useAdminLogoutAll() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authService.logoutAll(),
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      router.replace("/auth/login");
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RESETS
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
}

export function useAdminResetPassword() {
  return useMutation({
    mutationFn: (data: AdminResetPasswordRequest) => authService.resetPassword(data),
  });
}

export function useAdminForgotMasterKey() {
  return useMutation({
    mutationFn: ({ email, phone }: { email: string; phone: string }) =>
      authService.forgotMasterKey(email, phone),
  });
}

export function useAdminResetMasterKey() {
  return useMutation({
    mutationFn: (data: AdminResetMasterKeyRequest) => authService.resetMasterKey(data),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminSessions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: authKeys.sessions,
    queryFn: authService.getSessions,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getFieldErrors(error: unknown): Record<string, string> | null {
  if (error && typeof error === "object" && "fields" in error) {
    return (error as ApiError).fields ?? null;
  }
  return null;
}
