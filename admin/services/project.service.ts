// ─────────────────────────────────────────────────────────────────────────────
// services/project.service.ts
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/axios";
import type { BackendSuccessResponse } from "@/types/api.types";
import type {
  Project,
  AdminUpdateProjectPayload,
  ProjectFilters,
  PaginatedProjectsResponse,
} from "@/types/project.types";

export const projectService = {
  listAll: async (filters?: ProjectFilters): Promise<PaginatedProjectsResponse> => {
    const { data } = await apiClient.get<PaginatedProjectsResponse>(
      "/auth/admin/projects",
      { params: filters }
    );
    return data;
  },

  listByClient: async (filters?: ProjectFilters): Promise<Project[]> => {
    const { data } = await apiClient.get<BackendSuccessResponse<Project[]>>(
      "/projects",
      { params: filters }
    );
    return data.data || [];
  },

  listByFreelancer: async (filters?: ProjectFilters): Promise<Project[]> => {
    const { data } = await apiClient.get<BackendSuccessResponse<Project[]>>(
      "/projects/freelancer",
      { params: filters }
    );
    return data.data || [];
  },

  getById: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<BackendSuccessResponse<Project>>(
      `/projects/${id}`
    );
    return data.data!;
  },

  getBySlug: async (slug: string): Promise<Project> => {
    const { data } = await apiClient.get<BackendSuccessResponse<Project>>(
      `/projects/slug/${slug}`
    );
    return data.data!;
  },

  update: async (
    id: string,
    payload: AdminUpdateProjectPayload
  ): Promise<void> => {
    // Admin update route
    await apiClient.patch(`/auth/admin/projects/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    // Admin delete route
    await apiClient.delete(`/auth/admin/projects/${id}`);
  },
};
