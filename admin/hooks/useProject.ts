// ─────────────────────────────────────────────────────────────────────────────
// hooks/useProject.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectService } from "@/services/project.service";
import type { ApiError } from "@/types/api.types";
import type {
  AdminUpdateProjectPayload,
  ProjectFilters,
} from "@/types/project.types";

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  listClient: (filters?: ProjectFilters) =>
    [...projectKeys.lists(), "client", filters] as const,
  listFreelancer: (filters?: ProjectFilters) =>
    [...projectKeys.lists(), "freelancer", filters] as const,
  listAdmin: (filters?: ProjectFilters) =>
    [...projectKeys.lists(), "admin", filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (identifier: string) => [...projectKeys.details(), identifier] as const,
};

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
// LIST FREELANCER PROJECTS
// ─────────────────────────────────────────────────────────────────────────────

export function useFreelancerProjects(filters?: ProjectFilters) {
  const query = useQuery({
    queryKey: projectKeys.listFreelancer(filters),
    queryFn: () => projectService.listByFreelancer(filters),
    staleTime: 60 * 1000,
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
// GET PROJECT BY ID
// ─────────────────────────────────────────────────────────────────────────────

export function useProjectById(id: string) {
  const query = useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
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
// GET PROJECT BY SLUG
// ─────────────────────────────────────────────────────────────────────────────

export function useProjectBySlug(slug: string) {
  const query = useQuery({
    queryKey: projectKeys.detail(slug),
    queryFn: () => projectService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 60 * 1000,
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

export function useUpdateProject(identifier: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminUpdateProjectPayload;
    }) => projectService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(identifier) });
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

// ─────────────────────────────────────────────────────────────────────────────
// DELETE PROJECT
// ─────────────────────────────────────────────────────────────────────────────

export function useDeleteProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });

  return {
    deleteProject: mutation.mutate,
    deleteProjectAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    reset: mutation.reset,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST ALL PROJECTS (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminProjects(filters?: ProjectFilters) {
  const query = useQuery({
    queryKey: projectKeys.listAdmin(filters),
    queryFn: () => projectService.listAll(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000, // 30 seconds
  });

  return {
    data: query.data,
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  };
}
