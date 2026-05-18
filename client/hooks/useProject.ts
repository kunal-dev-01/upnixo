// ─────────────────────────────────────────────────────────────────────────────
// hooks/useProject.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import type { ApiError } from "@/types/api.types";
import type {
  CreateProjectPayload,
  ClientUpdateProjectPayload,
  ProjectFilters,
} from "@/types/project.types";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  listClient: (filters?: ProjectFilters) =>
    [...projectKeys.lists(), "client", filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (slug: string) => [...projectKeys.details(), slug] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PROJECT
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateProjectPayload) =>
      projectService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });

  return {
    createProject: mutation.mutate,
    createProjectAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST CLIENT PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

export function useClientProjects(filters?: ProjectFilters) {
  const query = useQuery({
    queryKey: projectKeys.listClient(filters),
    queryFn: () => projectService.listByClient(filters),
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    projects: query.data ?? [],
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PROJECT BY SLUG
// ─────────────────────────────────────────────────────────────────────────────

export function useProjectBySlug(slug: string) {
  const query = useQuery({
    queryKey: projectKeys.detail(slug),
    queryFn: () => projectService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 60 * 1000, // 1 minute
  });

  return {
    project: query.data,
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROJECT
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdateProject(slug?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ClientUpdateProjectPayload;
    }) => projectService.update(id, payload),
    onSuccess: () => {
      if (slug) {
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(slug) });
      }
      queryClient.invalidateQueries({ queryKey: projectKeys.details() });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });

  return {
    updateProject: mutation.mutate,
    updateProjectAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    reset: mutation.reset,
  };
}
