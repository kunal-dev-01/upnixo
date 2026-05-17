// ─────────────────────────────────────────────────────────────────────────────
// hooks/useMilestone.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query";
import { milestoneService } from "@/services/milestone.service";
import type { ApiError } from "@/types/api.types";

export const milestoneKeys = {
  all: ["milestones"] as const,
  lists: () => [...milestoneKeys.all, "list"] as const,
  listByProject: (projectId: string) => [...milestoneKeys.lists(), projectId] as const,
  details: () => [...milestoneKeys.all, "detail"] as const,
  detail: (id: string) => [...milestoneKeys.details(), id] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// LIST MILESTONES BY PROJECT
// ─────────────────────────────────────────────────────────────────────────────

export function useProjectMilestones(projectId: string) {
  const query = useQuery({
    queryKey: milestoneKeys.listByProject(projectId),
    queryFn: () => milestoneService.listByProject(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  return {
    milestones: query.data ?? [],
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET MILESTONE BY ID
// ─────────────────────────────────────────────────────────────────────────────

export function useMilestoneById(id: string) {
  const query = useQuery({
    queryKey: milestoneKeys.detail(id),
    queryFn: () => milestoneService.getById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });

  return {
    milestone: query.data,
    isPending: query.isPending,
    isSuccess: query.isSuccess,
    isError: query.isError,
    error: query.error as ApiError | null,
    refetch: query.refetch,
  };
}
