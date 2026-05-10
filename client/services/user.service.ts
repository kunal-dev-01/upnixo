// ─────────────────────────────────────────────────────────────────────────────
// services/user.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/axios";
import type { User } from "@/types/user.types";

const BASE = "/auth/user"; // Matches the routes.go grouping

async function getMe(): Promise<User> {
  const res = await apiClient.get<User>(`${BASE}/me`);
  return res.data;
}

export const userService = {
  getMe,
};
