// ─────────────────────────────────────────────────────────────────────────────
// services/user.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/axios";
import type { PaginatedUsersResponse, UserFilters } from "@/types/user.types";

export const userService = {
  listAll: async (filters?: UserFilters): Promise<PaginatedUsersResponse> => {
    const { data } = await apiClient.get<PaginatedUsersResponse>(
      "/auth/admin/users",
      { params: filters }
    );
    return data;
  },

  block: async (id: string, reason?: string): Promise<void> => {
    await apiClient.post(`/auth/admin/users/${id}/block`, { reason });
  },

  unblock: async (id: string): Promise<void> => {
    await apiClient.post(`/auth/admin/users/${id}/unblock`);
  },
};
