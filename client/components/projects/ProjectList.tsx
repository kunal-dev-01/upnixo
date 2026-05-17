import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClientProjects } from "@/hooks/useProject";
import type { Project, ProjectStatus } from "@/types/project.types";
import Dropdown from "@/common/Dropdown";
import { Projects, Github, Bolt, Wallet } from "@/svg/More";
import { Check, TriangleAlert } from "@/svg/Common";

// Imported modular sub-components
import NoProjects from "./NoProjects";
import ProjectListSkeleton from "./ProjectListSkeleton";

// Status configuration for custom branding & badges
const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; text: string; bg: string; border: string; glow: string }
> = {
  draft: {
    label: "Draft",
    text: "text-zinc-600 dark:text-zinc-400",
    bg: "bg-zinc-100 dark:bg-zinc-900/60",
    border: "border-zinc-200 dark:border-zinc-800",
    glow: "shadow-zinc-500/5",
  },
  active: {
    label: "Active Workspace",
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    border: "border-indigo-200 dark:border-indigo-900/30",
    glow: "shadow-indigo-500/5",
  },
  in_review: {
    label: "In Review",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    border: "border-amber-200 dark:border-amber-900/30",
    glow: "shadow-amber-500/5",
  },
  completed: {
    label: "Completed",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-900/30",
    glow: "shadow-emerald-500/5",
  },
  cancelled: {
    label: "Cancelled",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    border: "border-rose-200 dark:border-rose-900/30",
    glow: "shadow-rose-500/5",
  },
  disputed: {
    label: "Disputed",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-500/10",
    border: "border-orange-200 dark:border-orange-900/30",
    glow: "shadow-orange-500/5",
  },
};

const statusOptions = [
  { label: "All Statuses", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "In Review", value: "in_review" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Disputed", value: "disputed" },
];

interface ProjectListProps {
  onCreateClick?: () => void;
}

export default function ProjectList({ onCreateClick }: ProjectListProps) {
  const [status, setStatus] = useState<string>("");

  // Query hook: fetches projects filtered by selected status
  const { projects, isPending } = useClientProjects(
    status ? { status: status as ProjectStatus } : undefined
  );

  // Helper to format cash values
  const formatCurrency = (amount: string, currency: string) => {
    const numeric = parseFloat(amount) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numeric);
  };

  // Beautiful formatting for dates
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Flexible Timeline";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header & Status Filter Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20">
            <Projects className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Workspace Projects
              </h2>
              {onCreateClick && (
                <button
                  onClick={onCreateClick}
                  type="button"
                  className="px-2.5 py-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/50 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl transition-all cursor-pointer"
                >
                  + New Project
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isPending
                ? "Syncing workspaces..."
                : `${projects.length} project${projects.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
        </div>

        {/* Dynamic Status Dropdown Filter */}
        <div className="w-full sm:w-64">
          <Dropdown
            label=""
            options={statusOptions}
            value={status}
            onChange={(val) => setStatus(val)}
            placeholder="Select Status"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {isPending ? (
          /* ==================== SKELETON LOADER STATE ==================== */
          <ProjectListSkeleton />
        ) : projects.length === 0 ? (
          /* ==================== EMPTY STATE ==================== */
          <NoProjects onClick={onCreateClick} />
        ) : (
          /* ==================== PROJECTS GRID ==================== */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {projects.map((project: Project, idx: number) => {
              const config = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: idx * 0.05 },
                  }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`relative p-6 bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-900 rounded-3xl flex flex-col justify-between shadow-xs transition-all hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.3)] group overflow-hidden`}
                >
                  {/* Glowing background hint */}
                  <div
                    className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-15 transition-opacity group-hover:opacity-25 bg-indigo-500`}
                  />

                  {/* Header Row */}
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-xl border ${config.bg} ${config.text} ${config.border} shadow-2xs`}
                    >
                      {config.label}
                    </span>

                    <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                      <Bolt className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Priority {project.priority}</span>
                    </div>
                  </div>

                  {/* Main Details */}
                  <div className="flex-1 flex flex-col gap-2 mb-5">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Financial Overview Cards */}
                  <div className="grid grid-cols-2 gap-4 py-3.5 border-y border-zinc-100 dark:border-zinc-900 mb-4 bg-zinc-50/50 dark:bg-zinc-900/10 px-2 rounded-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none mb-1">
                          Budget
                        </span>
                        <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(project.budget, project.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl ${
                          project.is_escrow_funded
                            ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-500 dark:text-amber-400"
                        }`}
                      >
                        {project.is_escrow_funded ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <TriangleAlert className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider leading-none mb-1">
                          Escrow
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            project.is_escrow_funded
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {project.is_escrow_funded ? "Funded" : "Unfunded"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex justify-between items-center mt-1 text-xs">
                    <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                      <span>Timeline:</span>
                      <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                        {formatDate(project.deadline_at)}
                      </span>
                    </div>

                    {project.repository_url && (
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 font-semibold text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors group/link"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Repository</span>
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
