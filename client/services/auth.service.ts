// ─────────────────────────────────────────────────────────────────────────────
// services/auth.service.ts
// All routes under /api/v1/auth
// Backend response shape: { success: true, access_token?, user?, message? }
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from '@/lib/axios'
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  AuthResponse,
  VerifyEmailRequest,
  ResendVerifyRequest,
  MessageResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  Verify2FARequest,
  VerifyBackupCodeRequest,
  Confirm2FARequest,
  Disable2FARequest,
  Regenerate2FABackupRequest,
  Setup2FAResponse,
  RegenerateBackupCodesResponse,
  SessionView,
} from '@/types/auth.types'

const BASE = '/auth'

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────

async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await apiClient.post<RegisterResponse>(`${BASE}/register`, data)
  return res.data
}

async function verifyEmail(token: string): Promise<AuthResponse> {
  const res = await apiClient.get<AuthResponse>(`${BASE}/verify-email`, {
    params: { token },
  })
  return res.data
}

async function resendVerify(data: ResendVerifyRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/resend-verify`, data)
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>(`${BASE}/login`, data)
  return res.data
}

async function refresh(): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${BASE}/refresh`)
  return res.data
}

async function logout(): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/logout`)
  return res.data
}

async function logoutAll(): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/logout-all`)
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH
// Redirect user to backend — backend handles provider redirect + callback
// ─────────────────────────────────────────────────────────────────────────────

function redirectToGoogle(): void {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/oauth/google`
}

function redirectToGitHub(): void {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/oauth/github`
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

async function forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/forgot-password`, data)
  return res.data
}

async function resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/reset-password`, data)
  return res.data
}

async function changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/change-password`, data)
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// 2FA
// ─────────────────────────────────────────────────────────────────────────────

async function setup2FA(): Promise<Setup2FAResponse> {
  const res = await apiClient.post<Setup2FAResponse>(`${BASE}/2fa/setup`)
  return res.data
}

async function confirm2FA(data: Confirm2FARequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/2fa/confirm`, data)
  return res.data
}

async function verify2FA(data: Verify2FARequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${BASE}/2fa/verify`, data)
  return res.data
}

async function verifyBackupCode(data: VerifyBackupCodeRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${BASE}/2fa/backup`, data)
  return res.data
}

async function disable2FA(data: Disable2FARequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/2fa/disable`, data)
  return res.data
}

async function regenerateBackupCodes(data: Regenerate2FABackupRequest): Promise<RegenerateBackupCodesResponse> {
  const res = await apiClient.post<RegenerateBackupCodesResponse>(
    `${BASE}/2fa/backup/regenerate`,
    data,
  )
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

async function getSessions(): Promise<SessionView[]> {
  const res = await apiClient.get<{ sessions: SessionView[] }>(`${BASE}/sessions`)
  return res.data.sessions
}

async function revokeSession(sessionId: string): Promise<MessageResponse> {
  const res = await apiClient.delete<MessageResponse>(`${BASE}/sessions/${sessionId}`)
  return res.data
}

async function revokeAllOtherSessions(): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/logout-all`)
  return res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const authService = {
  // Account
  register,
  verifyEmail,
  resendVerify,
  // Login
  login,
  refresh,
  logout,
  logoutAll,
  // OAuth
  redirectToGoogle,
  redirectToGitHub,
  // Password
  forgotPassword,
  resetPassword,
  changePassword,
  // 2FA
  setup2FA,
  confirm2FA,
  verify2FA,
  verifyBackupCode,
  disable2FA,
  regenerateBackupCodes,
  // Sessions
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
}