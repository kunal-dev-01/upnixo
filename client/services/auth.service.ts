// ─────────────────────────────────────────────────────────────────────────────
// services/auth.service.ts — matches backend routes + response shapes exactly
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from '@/lib/axios'
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  AuthResponse,
  MessageResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  ResendVerifyRequest,
  Verify2FARequest,
  VerifyBackupCodeRequest,
  Confirm2FARequest,
  Disable2FARequest,
  Regenerate2FABackupRequest,
  Setup2FAResponse,
  RegenerateBackupCodesResponse,
  SessionsResponse,
  SessionView,
} from '@/types/auth.types'

const BASE = '/auth'

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────

// POST /auth/register → { success, message }
async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await apiClient.post<RegisterResponse>(`${BASE}/register`, data)
  return res.data
}

// GET /auth/verify-email?token=xxx → { success, access_token, user }
async function verifyEmail(token: string): Promise<AuthResponse> {
  const res = await apiClient.get<AuthResponse>(`${BASE}/verify-email`, {
    params: { token },
  })
  return res.data
}

// POST /auth/resend-verify → { success, message }
async function resendVerify(data: ResendVerifyRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/resend-verify`, data)
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

// POST /auth/login → { success, access_token, user } | { success, two_fa_required, two_fa_pending_token }
async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>(`${BASE}/login`, data)
  return res.data
}

// POST /auth/refresh → { success, access_token, user }
async function refresh(): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${BASE}/refresh`)
  return res.data
}

// POST /auth/logout → { success, message }
async function logout(): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/logout`)
  return res.data
}

// POST /auth/logout-all → { success, message }
async function logoutAll(): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/logout-all`)
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH — redirect to backend, backend handles provider + callback
// ─────────────────────────────────────────────────────────────────────────────

function redirectToGoogle(): void {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/oauth/google`
}

function redirectToGitHub(): void {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/oauth/github`
}

async function handleOAuthCallback(
  provider: string,
  code: string,
  state: string,
): Promise<LoginResponse> {
  const res = await apiClient.get<LoginResponse>(
    `${BASE}/oauth/${provider}/callback`,
    {
      params: { code, state },
    },
  )
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

// POST /auth/forgot-password → { success, message }
async function forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/forgot-password`, data)
  return res.data
}

// POST /auth/reset-password → { success, message }
async function resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/reset-password`, data)
  return res.data
}

// POST /auth/change-password → { success, message }
async function changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/change-password`, data)
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// 2FA
// ─────────────────────────────────────────────────────────────────────────────

// POST /auth/2fa/setup → { success, data: { qr_code_url, secret, backup_codes }, message }
async function setup2FA(): Promise<Setup2FAResponse> {
  const res = await apiClient.post<Setup2FAResponse>(`${BASE}/2fa/setup`)
  return res.data
}

// POST /auth/2fa/confirm → { success, message }
async function confirm2FA(data: Confirm2FARequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/2fa/confirm`, data)
  return res.data
}

// POST /auth/2fa/verify → { success, access_token, user }
async function verify2FA(data: Verify2FARequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${BASE}/2fa/verify`, data, {
    headers: {
      Authorization: `Bearer ${data.two_fa_pending_token}`,
    },
  })
  return res.data
}

// POST /auth/2fa/backup → { success, access_token, user }
async function verifyBackupCode(data: VerifyBackupCodeRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${BASE}/2fa/backup`, data, {
    headers: {
      Authorization: `Bearer ${data.two_fa_pending_token}`,
    },
  })
  return res.data
}

// POST /auth/2fa/disable → { success, message }
async function disable2FA(data: Disable2FARequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/2fa/disable`, data)
  return res.data
}

// POST /auth/2fa/backup/regenerate → { success, backup_codes, message }
async function regenerateBackupCodes(
  data: Regenerate2FABackupRequest,
): Promise<RegenerateBackupCodesResponse> {
  const res = await apiClient.post<RegenerateBackupCodesResponse>(
    `${BASE}/2fa/backup/regenerate`,
    data,
  )
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET /auth/sessions → { success, sessions: SessionView[] }
async function getSessions(): Promise<SessionView[]> {
  const res = await apiClient.get<SessionsResponse>(`${BASE}/sessions`)
  return res.data.sessions
}

// DELETE /auth/sessions/:id → { success, message }
async function revokeSession(sessionId: string): Promise<MessageResponse> {
  const res = await apiClient.delete<MessageResponse>(`${BASE}/sessions/${sessionId}`)
  return res.data
}

// POST /auth/logout-all → { success, message }
async function revokeAllOtherSessions(): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/logout-all`)
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const authService = {
  register,
  verifyEmail,
  resendVerify,
  login,
  refresh,
  logout,
  logoutAll,
  redirectToGoogle,
  redirectToGitHub,
  handleOAuthCallback,
  forgotPassword,
  resetPassword,
  changePassword,
  setup2FA,
  confirm2FA,
  verify2FA,
  verifyBackupCode,
  disable2FA,
  regenerateBackupCodes,
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
}