// ─────────────────────────────────────────────────────────────────────────────
// hooks/useMilestone.ts
// ─────────────────────────────────────────────────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { milestoneService } from "@/services/milestone.service";
import type { ApiError } from "@/types/api.types";
import type {
  CreateMilestonePayload,
  UpdateMilestonePayload,
} from "@/types/milestone.types";

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

// ─────────────────────────────────────────────────────────────────────────────
// CREATE MILESTONE
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateMilestone() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateMilestonePayload) =>
      milestoneService.create(payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: milestoneKeys.listByProject(variables.project_id),
      });
    },
  });

  return {
    createMilestone: mutation.mutate,
    createMilestoneAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    data: mutation.data,
    reset: mutation.reset,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE MILESTONE
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdateMilestone(projectId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateMilestonePayload;
    }) => milestoneService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: milestoneKeys.detail(variables.id),
      });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: milestoneKeys.listByProject(projectId),
        });
      }
    },
  });

  return {
    updateMilestone: mutation.mutate,
    updateMilestoneAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    reset: mutation.reset,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE MILESTONE
// ─────────────────────────────────────────────────────────────────────────────

export function useDeleteMilestone(projectId?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => milestoneService.delete(id),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: milestoneKeys.listByProject(projectId),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: milestoneKeys.lists() });
      }
    },
  });

  return {
    deleteMilestone: mutation.mutate,
    deleteMilestoneAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as ApiError | null,
    reset: mutation.reset,
  };
}
