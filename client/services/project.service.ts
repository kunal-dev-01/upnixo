// ─────────────────────────────────────────────────────────────────────────────
// services/project.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/axios";
import type { BackendSuccessResponse } from "@/types/api.types";
import type {
  Project,
  CreateProjectPayload,
  ClientUpdateProjectPayload,
  ProjectFilters,
} from "@/types/project.types";

export const projectService = {
  create: async (payload: CreateProjectPayload): Promise<Project> => {
    const { data } = await apiClient.post<BackendSuccessResponse<Project>>(
      "/projects",
      payload
    );
    return data.data!;
  },

  listByClient: async (filters?: ProjectFilters): Promise<Project[]> => {
    const { data } = await apiClient.get<BackendSuccessResponse<Project[]>>(
      "/projects",
      { params: filters }
    );
    return data.data || [];
  },

  getBySlug: async (slug: string): Promise<Project> => {
    const { data } = await apiClient.get<BackendSuccessResponse<Project>>(
      `/projects/slug/${slug}`
    );
    return data.data!;
  },

  update: async (
    id: string,
    payload: ClientUpdateProjectPayload
  ): Promise<void> => {
    await apiClient.patch(`/projects/${id}`, payload);
  },
};
