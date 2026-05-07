// ─────────────────────────────────────────────────────────────────────────────
// types/auth/auth.types.ts
// All types match backend dto package exactly
// ─────────────────────────────────────────────────────────────────────────────

import type { User } from '@/types/user.types'

// ── Requests ─────────────────────────────────────────────────────────────────

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

// ── 2FA Requests ──────────────────────────────────────────────────────────────

export interface Verify2FARequest {
    code: string
    two_fa_pending_token: string
}

export interface VerifyBackupCodeRequest {
    backup_code: string
    two_fa_pending_token: string
}

export interface Confirm2FARequest {
    code: string
}

export interface Disable2FARequest {
    code: string
}

export interface Regenerate2FABackupRequest {
    code: string
}

// ── Responses ────────────────────────────────────────────────────────────────

export interface MessageResponse {
    message: string
}

export interface RegisterResponse extends MessageResponse { }

// Returned after email verify, login (no 2FA), and OAuth (no 2FA)
export interface AuthResponse {
    access_token: string
    user: User
}

// Returned when login succeeds but 2FA is required
export interface TwoFAPendingResponse {
    two_fa_required: true
    two_fa_pending_token: string
    email: string
}

// Login can return either full auth or 2FA pending
export type LoginResponse = AuthResponse | TwoFAPendingResponse

export interface Setup2FAResponse {
    qr_code_url: string
    secret: string
    backup_codes: string[]
}

export interface RegenerateBackupCodesResponse {
    backup_codes: string[]
}

// ── Session ───────────────────────────────────────────────────────────────────

export interface SessionView {
    id: string
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

// ── Type guards ───────────────────────────────────────────────────────────────

export function isTwoFAPending(res: LoginResponse): res is TwoFAPendingResponse {
    return (res as TwoFAPendingResponse).two_fa_required === true
}

export function isAuthResponse(res: LoginResponse): res is AuthResponse {
    return (res as AuthResponse).access_token !== undefined
}