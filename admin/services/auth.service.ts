import { apiClient } from "@/lib/axios";
import type {
  AdminLoginRequest,
  AdminVerifyRequest,
  AdminAuthResponse,
  RefreshResponse,
  MessageResponse,
  AdminResetPasswordRequest,
  AdminResetMasterKeyRequest,
  SessionsResponse,
  SessionView,
} from "@/types/auth.types";

const BASE = "/auth/admin";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

async function login(data: AdminLoginRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/login`, data);
  return res.data;
}

async function verifyLogin(data: AdminVerifyRequest): Promise<AdminAuthResponse> {
  const res = await apiClient.post<AdminAuthResponse>(`${BASE}/verify`, data);
  return res.data;
}

async function refresh(): Promise<RefreshResponse> {
  const res = await apiClient.post<RefreshResponse>(`${BASE}/refresh`);
  return res.data;
}

async function logout(): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/logout`);
  return res.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESETS
// ─────────────────────────────────────────────────────────────────────────────

async function forgotPassword(email: string): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/forgot-password`, { email });
  return res.data;
}

async function resetPassword(data: AdminResetPasswordRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/reset-password`, data);
  return res.data;
}

async function forgotMasterKey(email: string, phone: string): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/forgot-master-key`, { email, phone });
  return res.data;
}

async function resetMasterKey(data: AdminResetMasterKeyRequest): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/reset-master-key`, data);
  return res.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────────────────────────────

async function getSessions(): Promise<SessionView[]> {
  const res = await apiClient.get<SessionsResponse>(`${BASE}/sessions`);
  return res.data.sessions;
}

async function revokeSession(sessionId: string): Promise<MessageResponse> {
  const res = await apiClient.delete<MessageResponse>(`${BASE}/sessions/${sessionId}`);
  return res.data;
}

async function logoutAll(): Promise<MessageResponse> {
  const res = await apiClient.post<MessageResponse>(`${BASE}/logout-all`);
  return res.data;
}

export const authService = {
  login,
  verifyLogin,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  forgotMasterKey,
  resetMasterKey,
  getSessions,
  revokeSession,
  logoutAll,
};
