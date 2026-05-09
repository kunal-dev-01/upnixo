// ─────────────────────────────────────────────────────────────────────────────
// hooks/useAuth.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { isTwoFAPending, isAuthSuccess } from '@/types/auth.types'
import type { ApiError } from '@/types/api.types'
import type {
  RegisterRequest,
  LoginRequest,
  ResendVerifyRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  Verify2FARequest,
  VerifyBackupCodeRequest,
  Confirm2FARequest,
  Disable2FARequest,
  Regenerate2FABackupRequest,
} from '@/types/auth.types'

// ─────────────────────────────────────────────────────────────────────────────
// QUERY KEYS
// ─────────────────────────────────────────────────────────────────────────────

export const authKeys = {
  me:       ['auth', 'me']       as const,
  sessions: ['auth', 'sessions'] as const,
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// Response: { success, message }
// ─────────────────────────────────────────────────────────────────────────────

export function useRegister() {
  const mutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
  })

  return {
    register: mutation.mutate,
    registerAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL
// Response: { success, access_token, user }
// ─────────────────────────────────────────────────────────────────────────────

export function useVerifyEmail() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })

  return {
    verifyEmail: mutation.mutate,
    verifyEmailAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESEND VERIFY
// Response: { success, message }
// ─────────────────────────────────────────────────────────────────────────────

export function useResendVerify() {
  const mutation = useMutation({
    mutationFn: (data: ResendVerifyRequest) => authService.resendVerify(data),
  })

  return {
    resendVerify: mutation.mutate,
    resendVerifyAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// Response A: { success, access_token, user }       → setAuth, go dashboard
// Response B: { success, two_fa_required, token }   → go /auth/2fa
// ─────────────────────────────────────────────────────────────────────────────

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (data) => {
      if (isTwoFAPending(data)) {
        sessionStorage.setItem('2fa_pending_token', data.two_fa_pending_token)
      }

      if (isAuthSuccess(data)) {
        setAuth(data.user, data.access_token)
        queryClient.invalidateQueries({ queryKey: authKeys.me })
      }
    },
  })

  return {
    login: mutation.mutate,
    loginAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// Always clear local state — even if backend fails
// ─────────────────────────────────────────────────────────────────────────────

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  const cleanup = () => {
    clearAuth()
    queryClient.clear()
    router.replace('/auth/login')
  }

  const mutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: cleanup,
    onError: cleanup,
  })

  return {
    logout: mutation.mutate,
    logoutAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

export function useLogoutAll() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  const cleanup = () => {
    clearAuth()
    queryClient.clear()
    router.replace('/auth/login')
  }

  const mutation = useMutation({
    mutationFn: () => authService.logoutAll(),
    onSuccess: cleanup,
    onError: cleanup,
  })

  return {
    logoutAll: mutation.mutate,
    logoutAllAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH — just redirect, backend handles everything
// ─────────────────────────────────────────────────────────────────────────────

export function useGoogleLogin() {
  return { login: authService.redirectToGoogle }
}

export function useGitHubLogin() {
  return { login: authService.redirectToGitHub }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD
// All responses: { success, message }
// ─────────────────────────────────────────────────────────────────────────────

export function useForgotPassword() {
  const mutation = useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authService.forgotPassword(data),
  })

  return {
    forgotPassword: mutation.mutate,
    forgotPasswordAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

export function useResetPassword() {
  const mutation = useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data),
  })

  return {
    resetPassword: mutation.mutate,
    resetPasswordAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

export function useChangePassword() {
  const mutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
  })

  return {
    changePassword: mutation.mutate,
    changePasswordAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2FA — LOGIN STEP 2
// Response: { success, access_token, user }
// ─────────────────────────────────────────────────────────────────────────────

export function useVerify2FA() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (data: Verify2FARequest) => authService.verify2FA(data),
    onSuccess: (data) => {
      sessionStorage.removeItem('2fa_pending_token')
      setAuth(data.user, data.access_token)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })

  return {
    verify2FA: mutation.mutate,
    verify2FAAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

export function useVerifyBackupCode() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (data: VerifyBackupCodeRequest) => authService.verifyBackupCode(data),
    onSuccess: (data) => {
      sessionStorage.removeItem('2fa_pending_token')
      setAuth(data.user, data.access_token)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })

  return {
    verifyBackupCode: mutation.mutate,
    verifyBackupCodeAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2FA — MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// Response: { success, data: { qr_code_url, secret, backup_codes }, message }
export function useSetup2FA() {
  const mutation = useMutation({
    mutationFn: () => authService.setup2FA(),
  })

  return {
    setup2FA: mutation.mutate,
    setup2FAAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// Response: { success, message }
export function useConfirm2FA() {
  const updateUser = useAuthStore((s) => s.updateUserLocally)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Confirm2FARequest) => authService.confirm2FA(data),
    onSuccess: () => {
      updateUser({ two_factor_enabled: true })
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })

  return {
    confirm2FA: mutation.mutate,
    confirm2FAAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// Response: { success, message } — backend revokes all sessions
export function useDisable2FA() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (data: Disable2FARequest) => authService.disable2FA(data),
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      router.replace('/auth/login')
    },
  })

  return {
    disable2FA: mutation.mutate,
    disable2FAAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// Response: { success, backup_codes, message }
export function useRegenerate2FABackupCodes() {
  const mutation = useMutation({
    mutationFn: (data: Regenerate2FABackupRequest) =>
      authService.regenerateBackupCodes(data),
  })

  return {
    regenerateBackupCodes: mutation.mutate,
    regenerateBackupCodesAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

// Response: { success, sessions: SessionView[] }
export function useSessions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const query = useQuery({
    queryKey: authKeys.sessions,
    queryFn: authService.getSessions,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  return {
    sessions: query.data ?? [],
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  }
}

// Response: { success, message }
export function useRevokeSession() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions })
    },
  })

  return {
    revokeSession: mutation.mutate,
    revokeSessionAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => authService.revokeAllOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions })
    },
  })

  return {
    revokeAllOther: mutation.mutate,
    revokeAllOtherAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — use directly in components
// ─────────────────────────────────────────────────────────────────────────────

export function getFieldErrors(error: unknown): Record<string, string> | null {
  if (error && typeof error === 'object' && 'fields' in error) {
    return (error as ApiError).fields ?? null
  }
  return null
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as Error).message
  }
  return 'Something went wrong'
}