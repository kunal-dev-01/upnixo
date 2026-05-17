// ─────────────────────────────────────────────────────────────────────────────
// services/milestone.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/axios";
import type { BackendSuccessResponse } from "@/types/api.types";
import type { Milestone } from "@/types/milestone.types";

export const milestoneService = {
  listByProject: async (projectId: string): Promise<Milestone[]> => {
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
};
