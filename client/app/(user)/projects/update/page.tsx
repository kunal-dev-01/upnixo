"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProjectBySlug, useUpdateProject } from "@/hooks/useProject";
import ProjectUpdate from "@/components/projects/ProjectUpdate";
import { Loader } from "@/common/Loader";
import Heading from "@/common/Heading";
import VariantButton from "@/common/VariantButton";
import { toast } from "sonner";

function UpdateProjectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug");

  const { project, isPending, isError, error } = useProjectBySlug(slug || "");
  const { updateProjectAsync, isPending: isUpdating } = useUpdateProject(slug || undefined);

  const handleBack = () => {
    router.push("/projects");
  };

  const handleSave = async (data: {
    title: string;
    description: string;
    priority: number;
    repository_url?: string;
  }) => {
    if (!project?.id) return;
    try {
      await updateProjectAsync({
        id: project.id,
        payload: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          repository_url: data.repository_url || undefined,
        },
      });
      toast.success("Project updated successfully!");
      router.push("/projects");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update project");
    }
  };

  // If slug is missing in query string
  if (!slug) {
    return (
      <div className="w-full mx-auto fade-in">
        <Heading
          title="Project Not Found"
          description="The requested project identifier is invalid or missing."
        />
        <div className="mt-6 p-6 bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-900 rounded-3xl flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            No project slug was provided in the URL query parameters. Please return to the workspace.
          </p>
          <div className="w-48">
            <VariantButton
              label="Back to projects"
              variant="default"
              onClick={handleBack}
            />
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isPending) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 animate-pulse">
          Fetching project details...
        </p>
      </div>
    );
  }

  // Error state
  if (isError || !project) {
    return (
      <div className="w-full mx-auto fade-in">
        <Heading
          title="Error Loading Project"
          description="We encountered an issue while retrieving the project workspace."
        />
        <div className="mt-6 p-6 bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-900 rounded-3xl flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-red-500 dark:text-red-400 font-medium">
            {error?.message || "Failed to load project details. It may have been deleted or you don't have access."}
          </p>
          <div className="w-48">
            <VariantButton
              label="Back to projects"
              variant="default"
              onClick={handleBack}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProjectUpdate
      project={project}
      isUpdating={isUpdating}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}

export default function UpdateProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center">
          <Loader className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>
      }
    >
      <UpdateProjectContent />
    </Suspense>
  );
}
