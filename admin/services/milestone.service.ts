// ─────────────────────────────────────────────────────────────────────────────
// services/milestone.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/axios";
import type { BackendSuccessResponse } from "@/types/api.types";
import type {
  Milestone,
  CreateMilestonePayload,
  UpdateMilestonePayload,
} from "@/types/milestone.types";

export const milestoneService = {
  listByProject: async (projectId: string): Promise<Milestone[]> => {
    // Admin uses the same read endpoint, middleware bypasses access checks if admin
    const { data } = await apiClient.get<BackendSuccessResponse<Milestone[]>>(
      `/milestones/project/${projectId}`
    );
    return data.data || [];
  },

  getById: async (id: string): Promise<Milestone> => {
    const { data } = await apiClient.get<BackendSuccessResponse<Milestone>>(
      `/milestones/${id}`
    );
    return data.data!;
  },

  create: async (payload: CreateMilestonePayload): Promise<Milestone> => {
    const { data } = await apiClient.post<BackendSuccessResponse<Milestone>>(
      "/auth/admin/milestones",
      payload
    );
    return data.data!;
  },

  update: async (
    id: string,
    payload: UpdateMilestonePayload
  ): Promise<void> => {
    await apiClient.patch(`/auth/admin/milestones/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/auth/admin/milestones/${id}`);
  },
};
