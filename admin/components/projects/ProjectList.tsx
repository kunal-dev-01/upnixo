import React, { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
  useAdminProjects,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/useProject";
import type { Project, ProjectStatus, ProjectFilters } from "@/types/project.types";
import ProjectCard from "./ProjectCard";
import ConfirmModal from "@/common/ConfirmModal";
import Input from "@/common/Input";
import Dropdown from "@/common/Dropdown";
import Radio from "@/common/RadioButton";
import SubHeading from "@/common/SubHeading";
import MonoButton from "@/common/MonoButton";
import { ArrowLeft } from "@/svg/Common";

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM SVG ICONS FOR PROJECT LIST AESTHETICS
// ─────────────────────────────────────────────────────────────────────────────
const BriefcaseIcon = () => (
  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const FolderOpenIcon = () => (
  <svg className="w-8 h-8 text-zinc-650" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
  </svg>
);

const SyncIcon = () => (
  <svg className="w-5 h-5 text-emerald-450" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ProjectList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active overlays/modals states
  const [selectedProjectForStatus, setSelectedProjectForStatus] = useState<Project | null>(null);
  const [selectedProjectForDelete, setSelectedProjectForDelete] = useState<Project | null>(null);
  const [selectedProjectForUpdate, setSelectedProjectForUpdate] = useState<Project | null>(null);
  const [selectedProjectForSee, setSelectedProjectForSee] = useState<Project | null>(null);

  // Status Change Temp State
  const [tempStatus, setTempStatus] = useState<ProjectStatus>("draft");

  // Edit Specification Temp States
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");
  const [editPriority, setEditPriority] = useState(1);
  const [editRepo, setEditRepo] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  // Map Filter Options for React Query Admin API call
  const apiFilters: ProjectFilters = {
    status: statusFilter !== "all" ? (statusFilter as ProjectStatus) : undefined,
    priority: priorityFilter !== "all" ? parseInt(priorityFilter, 10) : undefined,
    page: currentPage,
    size: itemsPerPage,
  };

  // Queries & Mutations
  const { data, isPending, isError, refetch } = useAdminProjects(apiFilters);
  const { deleteProjectAsync, isPending: isDeleting } = useDeleteProject();

  // Instantiate update mutation using either selected project identifier or empty fallback
  const currentUpdateIdentifier =
    selectedProjectForStatus?.id || selectedProjectForUpdate?.id || "";
  const { updateProjectAsync, isPending: isUpdating } = useUpdateProject(
    currentUpdateIdentifier
  );

  // Trigger Status Update Dialog Overlay
  const handleStatusChangeTrigger = (project: Project) => {
    setSelectedProjectForStatus(project);
    setTempStatus(project.status);
  };

  // Trigger specifications update Dialog Overlay
  const handleUpdateTrigger = (project: Project) => {
    setSelectedProjectForUpdate(project);
    setEditTitle(project.title);
    setEditDesc(project.description || "");
    setEditBudget(project.budget);
    setEditCurrency(project.currency || "USD");
    setEditPriority(project.priority || 1);
    setEditRepo(project.repository_url || "");
    setEditDeadline(
      project.deadline_at ? project.deadline_at.split("T")[0] : ""
    );
  };

  // Trigger Delete Confirmation Dialog Overlay
  const handleDeleteTrigger = (project: Project) => {
    setSelectedProjectForDelete(project);
  };

  // Trigger Detail Inspector Overlay
  const handleSeeTrigger = (project: Project) => {
    setSelectedProjectForSee(project);
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
        `Lifecycle status for ${selectedProjectForStatus.title} updated to ${tempStatus.replace("_", " ")}.`
      );
      setSelectedProjectForStatus(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update project status. Please try again.");
    }
  };

  // Submit Specifications Modification
  const onSpecificationsSubmit = async () => {
    if (!selectedProjectForUpdate) return;
    try {
      await updateProjectAsync({
        id: selectedProjectForUpdate.id,
        payload: {
          title: editTitle,
          description: editDesc,
          budget: editBudget,
          currency: editCurrency,
          priority: editPriority,
          repository_url: editRepo || undefined,
          deadline_at: editDeadline ? new Date(editDeadline).toISOString() : undefined,
        },
      });
      toast.success(`Specifications for ${editTitle} updated successfully.`);
      setSelectedProjectForUpdate(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update specifications.");
    }
  };

  // Submit Deletion Target
  const onDeleteConfirmSubmit = async () => {
    if (!selectedProjectForDelete) return;
    try {
      await deleteProjectAsync(selectedProjectForDelete.id);
      toast.success(`Workspace for ${selectedProjectForDelete.title} successfully terminated.`);
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
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-3xl">
        {/* SubHeading */}
        <SubHeading
          title="Project Workspace"
          description="Monitor deliverables, client scopes, priorities, and project transitions"
          icon={BriefcaseIcon}
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
                { label: "All Statuses", value: "all" },
                { label: "Draft Spec", value: "draft" },
                { label: "Active Project", value: "active" },
                { label: "In Review", value: "in_review" },
                { label: "Completed", value: "completed" },
                { label: "Cancelled", value: "cancelled" },
                { label: "Disputed", value: "disputed" },
              ]}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1); // Reset to page 1 on filter
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
                { label: "Priority Level 4", value: "4" },
                { label: "Priority Level 5", value: "5" },
              ]}
              onChange={(val) => {
                setPriorityFilter(val);
                setCurrentPage(1); // Reset to page 1 on filter
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
        <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-4 border border-zinc-900 rounded-2xl bg-zinc-950/50">
          <div className="p-4 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center">
            <FolderOpenIcon />
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-white">
              Workspace Query Interrupted
            </h4>
            <p className="text-sm text-zinc-500 mt-1 max-w-md">
              Unable to query workspace records. Please verify server connection and try again.
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
            <FolderOpenIcon />
          </div>
          <div className="space-y-1.5 px-6">
            <h4 className="text-lg font-extrabold text-white">
              No Workspaces Tracked
            </h4>
            <p className="text-sm text-zinc-500 max-w-sm">
              No project workspaces match your active filter queries. Reset your filters to view all projects.
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
                    onUpdateTrigger={handleUpdateTrigger}
                    onDeleteTrigger={handleDeleteTrigger}
                    onSeeTrigger={handleSeeTrigger}
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
      >
        <div className="grid grid-cols-2 gap-3 py-2 text-left">
          {(["draft", "active", "in_review", "completed", "cancelled", "disputed"] as ProjectStatus[]).map((status) => (
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
          OVERLAY 2: EDIT WORKSPACE SPECIFICATIONS (FORM MODAL)
          ─────────────────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={selectedProjectForUpdate !== null}
        onClose={() => setSelectedProjectForUpdate(null)}
        onConfirm={onSpecificationsSubmit}
        title="Modify Specs"
        description={`Overwrite budget estimates, delivery goals, priority ranks, and repository configurations for "${selectedProjectForUpdate?.title}".`}
        confirmLabel="Update Specifications"
        cancelLabel="Cancel"
        isPending={isUpdating}
      >
        <div className="space-y-4 py-2 text-left">
          <div className="space-y-1 text-left">
            <span className="text-xs font-bold text-zinc-350 block">Workspace Title</span>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-3 text-sm font-semibold border-2 outline-none rounded-2xl bg-zinc-950 border-zinc-900 hover:border-zinc-800 focus:border-indigo-500 transition-all text-white"
            />
          </div>

          <div className="space-y-1 text-left">
            <span className="text-xs font-bold text-zinc-350 block">Workspace Description</span>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-sm font-semibold border-2 outline-none rounded-2xl bg-zinc-950 border-zinc-900 hover:border-zinc-800 focus:border-indigo-500 transition-all text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-zinc-350 block">Budget Value</span>
              <input
                type="text"
                value={editBudget}
                onChange={(e) => setEditBudget(e.target.value)}
                className="w-full px-4 py-3 text-sm font-semibold border-2 outline-none rounded-2xl bg-zinc-950 border-zinc-900 hover:border-zinc-800 focus:border-indigo-500 transition-all text-white"
              />
            </div>

            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-zinc-350 block">Currency</span>
              <input
                type="text"
                value={editCurrency}
                onChange={(e) => setEditCurrency(e.target.value)}
                className="w-full px-4 py-3 text-sm font-semibold border-2 outline-none rounded-2xl bg-zinc-950 border-zinc-900 hover:border-zinc-800 focus:border-indigo-500 transition-all text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-zinc-350 block">Priority Rank (1-5)</span>
              <input
                type="number"
                min={1}
                max={5}
                value={editPriority}
                onChange={(e) => setEditPriority(parseInt(e.target.value, 10))}
                className="w-full px-4 py-3 text-sm font-semibold border-2 outline-none rounded-2xl bg-zinc-950 border-zinc-900 hover:border-zinc-800 focus:border-indigo-500 transition-all text-white"
              />
            </div>

            <div className="space-y-1 text-left">
              <span className="text-xs font-bold text-zinc-350 block">Target Deadline</span>
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="w-full px-4 py-3 text-sm font-semibold border-2 outline-none rounded-2xl bg-zinc-950 border-zinc-900 hover:border-zinc-800 focus:border-indigo-500 transition-all text-white"
              />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <span className="text-xs font-bold text-zinc-350 block">Repository Link URL</span>
            <input
              type="url"
              placeholder="https://github.com/org/repo"
              value={editRepo}
              onChange={(e) => setEditRepo(e.target.value)}
              className="w-full px-4 py-3 text-sm font-semibold border-2 outline-none rounded-2xl bg-zinc-950 border-zinc-900 hover:border-zinc-800 focus:border-indigo-500 transition-all text-white"
            />
          </div>
        </div>
      </ConfirmModal>

      {/* ───────────────────────────────────────────────────────────────────────
          OVERLAY 3: TERMINATE WORKSPACE (CONFIRM DELETE DIALOG)
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
      />

      {/* ───────────────────────────────────────────────────────────────────────
          OVERLAY 4: DETAIL INSPECTOR (SEE PROJECT DIALOG)
          ─────────────────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={selectedProjectForSee !== null}
        onClose={() => setSelectedProjectForSee(null)}
        onConfirm={() => setSelectedProjectForSee(null)}
        title="Workspace Specification Dossier"
        description={`Detailed operational summary for "${selectedProjectForSee?.title}".`}
        confirmLabel="Dismiss View"
        cancelLabel=""
      >
        {selectedProjectForSee && (
          <div className="space-y-4 py-2 text-left text-sm leading-relaxed">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Description Specifications</span>
              <p className="text-zinc-300 font-medium select-all mt-1 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900/60 leading-normal">
                {selectedProjectForSee.description || "No description specifications logged."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Unique ID</span>
                <span className="text-zinc-350 select-all font-mono break-all">{selectedProjectForSee.id}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Project Slug</span>
                <span className="text-zinc-350 select-all font-mono break-all">{selectedProjectForSee.slug}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-3">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Client Owner Key</span>
                <span className="text-zinc-350 select-all font-mono break-all">{selectedProjectForSee.client_id}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Expert Assignee Key</span>
                <span className="text-zinc-350 select-all font-mono break-all">{selectedProjectForSee.freelancer_id || "None Assigned"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-3">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Timestamps Logged</span>
                <span className="text-zinc-400 block text-xs">Created: {new Date(selectedProjectForSee.created_at).toLocaleString()}</span>
                <span className="text-zinc-400 block text-xs">Updated: {new Date(selectedProjectForSee.updated_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Repository Link</span>
                {selectedProjectForSee.repository_url ? (
                  <a
                    href={selectedProjectForSee.repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 font-medium hover:underline flex items-center gap-1.5 mt-1 select-all"
                  >
                    <span>Visit Repository</span>
                    <ExternalLinkIcon />
                  </a>
                ) : (
                  <span className="text-zinc-500 block text-xs mt-1">No repository configured</span>
                )}
              </div>
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}

export default ProjectList;
