// ─────────────────────────────────────────────────────────────────────────────
// services/user.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/axios";
import type {
  UpdatePreferencesPayload,
  UpdateUserPayload,
  User,
} from "@/types/user.types";

const BASE = "/user";

async function getMe(): Promise<User> {
  const res = await apiClient.get<User>(`${BASE}/me`);
  return res.data;
}

async function updateProfile(
  data: UpdateUserPayload,
): Promise<UpdateUserPayload> {
  const res = await apiClient.patch<{
    success: boolean;
    data: UpdateUserPayload;
  }>(`${BASE}/profile`, data);
  return res.data.data;
}

async function updatePreferences(
  data: UpdatePreferencesPayload,
): Promise<UpdatePreferencesPayload> {
  const res = await apiClient.patch<{
    success: boolean;
    data: UpdatePreferencesPayload;
  }>(`${BASE}/preferences`, data);
  return res.data.data;
}

async function updateAvatar(file: File): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await apiClient.post<{ success: boolean; message: string }>(
    `${BASE}/avatar`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return res.data;
}

export const userService = {
  getMe,
  updateProfile,
  updatePreferences,
  updateAvatar,
};
