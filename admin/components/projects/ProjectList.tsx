import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
  useAdminProjects,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProject";
import type {
  Project,
  ProjectStatus,
  ProjectFilters,
} from "@/types/project.types";
import ProjectCard from "./ProjectCard";
import ConfirmModal from "@/common/ConfirmModal";
import Dropdown from "@/common/Dropdown";
import Radio from "@/common/RadioButton";
import SubHeading from "@/common/SubHeading";
import MonoButton from "@/common/MonoButton";
import { ArrowLeft } from "@/svg/Common";
import { Books, Projects } from "@/svg/More";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ProjectList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active overlays/modals states (selectedProjectForUpdate state removed)
  const [selectedProjectForStatus, setSelectedProjectForStatus] =
    useState<Project | null>(null);
  const [selectedProjectForDelete, setSelectedProjectForDelete] =
    useState<Project | null>(null);

  // Status Change Temp State
  const [tempStatus, setTempStatus] = useState<ProjectStatus>("draft");

  // Map Filter Options for React Query Admin API call
  const apiFilters: ProjectFilters = {
    status:
      statusFilter !== "all" ? (statusFilter as ProjectStatus) : undefined,
    priority:
      priorityFilter !== "all" ? parseInt(priorityFilter, 10) : undefined,
    page: currentPage,
    size: itemsPerPage,
  };

  // Queries & Mutations
  const { data, isPending, isError, refetch } = useAdminProjects(apiFilters);
  const { deleteProjectAsync, isPending: isDeleting } = useDeleteProject();

  // Instantiate update mutation using selected status project identifier or fallback
  const currentUpdateIdentifier = selectedProjectForStatus?.id || "";
  const { updateProjectAsync, isPending: isUpdating } = useUpdateProject(
    currentUpdateIdentifier,
  );

  // Trigger Status Update Dialog Overlay
  const handleStatusChangeTrigger = (project: Project) => {
    setSelectedProjectForStatus(project);
    setTempStatus(project.status);
  };

  // Trigger Delete Confirmation Dialog Overlay
  const handleDeleteTrigger = (project: Project) => {
    setSelectedProjectForDelete(project);
  };

  // Submit Status Transition
  const onStatusChangeSubmit = async () => {
    if (!selectedProjectForStatus) return;
    try {
      await updateProjectAsync({
        id: selectedProjectForStatus.id,
        payload: { status: tempStatus },
      });
      toast.success(
        `Lifecycle status for ${selectedProjectForStatus.title} updated to ${tempStatus.replace("_", " ")}.`,
      );
      setSelectedProjectForStatus(null);
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to update project status. Please try again.",
      );
    }
  };

  // Submit Deletion Target
  const onDeleteConfirmSubmit = async () => {
    if (!selectedProjectForDelete) return;
    try {
      await deleteProjectAsync(selectedProjectForDelete.id);
      toast.success(
        `Workspace for ${selectedProjectForDelete.title} successfully terminated.`,
      );
      setSelectedProjectForDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to terminate workspace.");
    }
  };

  const projectList = data?.projects || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Filtering & Control panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-3xl shadow-none">
        {/* SubHeading */}
        <SubHeading
          title="Project Workspace"
          description="Monitor deliverables, client scopes, priorities, and project transitions"
          icon={Projects}
          iconBgColor="bg-indigo-500/10"
          iconClassName="text-indigo-400"
        />

        {/* Dropdown Filters Group */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Status Dropdown */}
          <div className="w-full sm:w-48">
            <Dropdown
              label=""
              placeholder="Status"
              value={statusFilter}
              options={[
                { label: "All Status", value: "all" },
                { label: "Draft", value: "draft" },
                { label: "Active", value: "active" },
                { label: "In Review", value: "in_review" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
                { label: "Disputed", value: "disputed" },
              ]}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Priority Dropdown */}
          <div className="w-full sm:w-44">
            <Dropdown
              label=""
              placeholder="Priority"
              value={priorityFilter}
              options={[
                { label: "All Priorities", value: "all" },
                { label: "Priority Level 1", value: "1" },
                { label: "Priority Level 2", value: "2" },
                { label: "Priority Level 3", value: "3" },
              ]}
              onChange={(val) => {
                setPriorityFilter(val);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {isPending ? (
        // Premium Loading skeleton grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="h-[280px] bg-zinc-900/35 border border-zinc-900 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-4 border border-zinc-900 rounded-2xl bg-zinc-950/50 shadow-none">
          <div className="p-4 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
            <Books className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-white">
              Workspace Query Interrupted
            </h4>
            <p className="text-sm text-zinc-500 mt-1 max-w-md">
              Unable to query workspace records. Please verify server connection
              and try again.
            </p>
          </div>
          <MonoButton isLoading={isPending} onClick={() => refetch()}>
            Reconnect Server
          </MonoButton>
        </div>
      ) : projectList.length === 0 ? (
        // Premium Empty state UI
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-3xl"
        >
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
            <Books className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 px-6">
            <h4 className="text-lg font-extrabold text-white">
              No Workspaces Tracked
            </h4>
            <p className="text-sm text-zinc-500 max-w-sm">
              No project workspaces match your active filter queries. Reset your
              filters to view all projects.
            </p>
          </div>
          {(statusFilter !== "all" || priorityFilter !== "all") && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
              className="px-6 py-2.5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 text-sm font-bold cursor-pointer transition-all shadow-none"
            >
              Reset Filters
            </button>
          )}
        </motion.div>
      ) : (
        // Workspace grid layout (2 col on desktop, 1 col on mobile)
        <div className="space-y-6">
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {projectList.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProjectCard
                    project={project}
                    onStatusChangeTrigger={handleStatusChangeTrigger}
                    onDeleteTrigger={handleDeleteTrigger}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Conditional Pagination Controls */}
          {totalItems > itemsPerPage && (
            <div className="flex items-center justify-between pt-6 border-t border-zinc-900 w-full mt-8">
              <span className="text-xs font-bold text-zinc-550 select-none">
                Showing{" "}
                <strong className="text-zinc-350">
                  {(currentPage - 1) * itemsPerPage + 1}
                </strong>{" "}
                -{" "}
                <strong className="text-zinc-350">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </strong>{" "}
                of <strong className="text-zinc-350">{totalItems}</strong>{" "}
                workspaces
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl border border-zinc-850 bg-zinc-950 text-zinc-450 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900 transition-all cursor-pointer flex items-center justify-center shadow-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-zinc-350 select-none px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl border border-zinc-850 bg-zinc-950 text-zinc-450 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900 transition-all cursor-pointer flex items-center justify-center shadow-none"
                >
                  <ArrowLeft className="rotate-180 w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          OVERLAY 1: UPDATE LIFECYCLE STATUS (WITH RADIO BUTTONS)
          ─────────────────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={selectedProjectForStatus !== null}
        onClose={() => setSelectedProjectForStatus(null)}
        onConfirm={onStatusChangeSubmit}
        title="Update Workspace Status"
        description={`Configure the delivery lifecycle phase for project "${selectedProjectForStatus?.title}".`}
        confirmLabel="Save Status"
        cancelLabel="Cancel"
        isPending={isUpdating}
        variant="default"
      >
        <div className="grid grid-cols-2 gap-3 py-2 text-left">
          {(
            [
              "draft",
              "active",
              "in_review",
              "completed",
              "cancelled",
              "disputed",
            ] as ProjectStatus[]
          ).map((status) => (
            <Radio
              key={status}
              label={status.replace("_", " ").toUpperCase()}
              id={`radio-${status}`}
              name="temp-status"
              value={status}
              checked={tempStatus === status}
              onChange={() => setTempStatus(status)}
              wrapperClassName="border border-zinc-900 rounded-xl"
            />
          ))}
        </div>
      </ConfirmModal>

      {/* ───────────────────────────────────────────────────────────────────────
          OVERLAY 2: TERMINATE WORKSPACE (CONFIRM DELETE DIALOG)
          ─────────────────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={selectedProjectForDelete !== null}
        onClose={() => setSelectedProjectForDelete(null)}
        onConfirm={onDeleteConfirmSubmit}
        title="Terminate Project Workspace"
        description={`Confirming this will permanently purge "${selectedProjectForDelete?.title}" and delete all milestones, scope specs, and associated records. This action is irreversible.`}
        confirmLabel="Purge Workspace"
        cancelLabel="Cancel"
        isPending={isDeleting}
        variant="danger"
      />
    </div>
  );
}

export default ProjectList;
