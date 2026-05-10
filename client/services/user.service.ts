// ─────────────────────────────────────────────────────────────────────────────
// services/user.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/axios";
import type { UpdatePreferencesPayload, UpdateUserPayload, User } from "@/types/user.types";

const BASE = "/auth/user"; // Matches the routes.go grouping

async function getMe(): Promise<User> {
  const res = await apiClient.get<User>(`${BASE}/me`);
  return res.data;
}

async function updateProfile(data: UpdateUserPayload): Promise<UpdateUserPayload> {
  const res = await apiClient.patch<{ success: boolean; data: UpdateUserPayload }>(`${BASE}/profile`, data);
  return res.data.data;
}

async function updatePreferences(data: UpdatePreferencesPayload): Promise<UpdatePreferencesPayload> {
  const res = await apiClient.patch<{ success: boolean; data: UpdatePreferencesPayload }>(`${BASE}/preferences`, data);
  return res.data.data;
}

export const userService = {
  getMe,
  updateProfile,
  updatePreferences,
};
