// ─────────────────────────────────────────────────────────────────────────────
// types/auth/auth.types.ts — matches backend handler responses exactly
// ─────────────────────────────────────────────────────────────────────────────

import type { User } from '@/types/user.types'

// ─────────────────────────────────────────────────────────────────────────────
// REQUESTS
// ─────────────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  full_name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerifyRequest {
  email: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export interface Confirm2FARequest {
  code: string
}

export interface Verify2FARequest {
  code: string
  two_fa_pending_token: string
}

export interface VerifyBackupCodeRequest {
  backup_code: string
  two_fa_pending_token: string
}

export interface Disable2FARequest {
  code: string
}

export interface Regenerate2FABackupRequest {
  code: string
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSES — match backend fiber.Map exactly
// ─────────────────────────────────────────────────────────────────────────────

// { success: true, message: string }
export interface MessageResponse {
  success: true
  message: string
}

// POST /register → { success, message }
export type RegisterResponse = MessageResponse

// GET /verify-email → { success, access_token, user }
// POST /2fa/verify  → { success, access_token, user }
// POST /2fa/backup  → { success, access_token, user }
export interface AuthResponse {
  success: true
  access_token: string
  user: User
}

// POST /refresh → { success, access_token }
export interface RefreshResponse {
  success: true
  access_token: string
}

// POST /login — two possible shapes
export interface LoginSuccessResponse {
  success: true
  access_token: string
  user: User
}

export interface TwoFAPendingResponse {
  success: true
  two_fa_required: true
  two_fa_pending_token: string
  message: string
}

export type LoginResponse = LoginSuccessResponse | TwoFAPendingResponse

// POST /auth/oauth/google/callback — same two shapes as login
export type OAuthCallbackResponse = LoginSuccessResponse | TwoFAPendingResponse

// POST /2fa/setup → { success, data: { qr_code_url, secret, backup_codes }, message }
export interface Setup2FAData {
  qr_code_url: string
  secret: string
  backup_codes: string[]
}

export interface Setup2FAResponse {
  success: true
  data: Setup2FAData
  message: string
}

// POST /2fa/backup/regenerate → { success, backup_codes, message }
export interface RegenerateBackupCodesResponse {
  success: true
  backup_codes: string[]
  message: string
}

// GET /sessions → { success, sessions: SessionView[] }
export interface SessionView {
  id: string
  role: string
  ip_address: string
  browser: string
  os: string
  device_name: string
  city: string
  country: string
  created_at: string
  expires_at: string
  is_current: boolean
}

export interface SessionsResponse {
  success: true
  sessions: SessionView[]
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPE GUARDS
// ─────────────────────────────────────────────────────────────────────────────

export function isTwoFAPending(res: LoginResponse): res is TwoFAPendingResponse {
  return 'two_fa_required' in res && res.two_fa_required === true
}

export function isAuthSuccess(res: LoginResponse): res is LoginSuccessResponse {
  return 'access_token' in res
}