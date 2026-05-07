// ─────────────────────────────────────────────────────────────────────────────
// hooks/useAuth.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { isTwoFAPending } from '@/types/auth.types'
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
// ─────────────────────────────────────────────────────────────────────────────

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL
// Auto-logs in on success
// ─────────────────────────────────────────────────────────────────────────────

export function useVerifyEmail() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// RESEND VERIFY
// ─────────────────────────────────────────────────────────────────────────────

export function useResendVerify() {
  return useMutation({
    mutationFn: (data: ResendVerifyRequest) => authService.resendVerify(data),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// No 2FA  → setAuth, redirect to dashboard
// 2FA req → redirect to /auth/2fa with pending token
// ─────────────────────────────────────────────────────────────────────────────

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (data) => {
      if (isTwoFAPending(data)) {
        // Store pending token in session storage — cleared after 2FA
        sessionStorage.setItem('2fa_pending_token', data.two_fa_pending_token)
        sessionStorage.setItem('2fa_email', data.email)
        router.push('/auth/2fa')
        return
      }
      setAuth(data.user, data.access_token)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
      router.push('/dashboard')
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// Always clear local state — even if backend call fails
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

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: cleanup,
    onError: cleanup, // always logout locally
  })
}

export function useLogoutAll() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: () => authService.logoutAll(),
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      router.replace('/auth/login')
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH
// ─────────────────────────────────────────────────────────────────────────────

export function useGoogleLogin() {
  return { login: authService.redirectToGoogle }
}

export function useGitHubLogin() {
  return { login: authService.redirectToGitHub }
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authService.forgotPassword(data),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authService.resetPassword(data),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authService.changePassword(data),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 2FA — LOGIN STEP 2
// ─────────────────────────────────────────────────────────────────────────────

export function useVerify2FA() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: Verify2FARequest) => authService.verify2FA(data),
    onSuccess: (data) => {
      sessionStorage.removeItem('2fa_pending_token')
      sessionStorage.removeItem('2fa_email')
      setAuth(data.user, data.access_token)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
      router.replace('/dashboard')
    },
  })
}

export function useVerifyBackupCode() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: VerifyBackupCodeRequest) => authService.verifyBackupCode(data),
    onSuccess: (data) => {
      sessionStorage.removeItem('2fa_pending_token')
      sessionStorage.removeItem('2fa_email')
      setAuth(data.user, data.access_token)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
      router.replace('/dashboard')
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 2FA — MANAGEMENT (authenticated)
// ─────────────────────────────────────────────────────────────────────────────

export function useSetup2FA() {
  return useMutation({
    mutationFn: () => authService.setup2FA(),
  })
}

export function useConfirm2FA() {
  const queryClient = useQueryClient()
  const updateUser = useAuthStore((s) => s.updateUserLocally)

  return useMutation({
    mutationFn: (data: Confirm2FARequest) => authService.confirm2FA(data),
    onSuccess: () => {
      updateUser({ two_factor_enabled: true })
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

export function useDisable2FA() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (data: Disable2FARequest) => authService.disable2FA(data),
    onSuccess: () => {
      // Backend revokes all sessions on disable — force re-login
      clearAuth()
      queryClient.clear()
      router.replace('/auth/login')
    },
  })
}

export function useRegenerate2FABackupCodes() {
  return useMutation({
    mutationFn: (data: Regenerate2FABackupRequest) =>
      authService.regenerateBackupCodes(data),
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

export function useSessions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: authKeys.sessions,
    queryFn: authService.getSessions,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => authService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions })
    },
  })
}

export function useRevokeAllOtherSessions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.revokeAllOtherSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.sessions })
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — use in components
// ─────────────────────────────────────────────────────────────────────────────

/** Returns field-level validation errors from an ApiError, or null */
export function getFieldErrors(error: unknown): Record<string, string> | null {
  if (error && typeof error === 'object' && 'fields' in error) {
    return (error as ApiError).fields ?? null
  }
  return null
}

/** Returns human-readable error message from an ApiError */
export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as ApiError).message
  }
  return 'Something went wrong'
}