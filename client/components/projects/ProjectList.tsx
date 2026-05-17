import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClientProjects } from "@/hooks/useProject";
import type { Project, ProjectStatus } from "@/types/project.types";
import Dropdown from "@/common/Dropdown";
import { Projects } from "@/svg/More";
import NoProjects from "./NoProjects";
import ProjectListSkeleton from "./ProjectListSkeleton";
import ProjectCard from "./ProjectCard";
import SubHeading from "@/common/SubHeading";
import { statusOptions } from "@/utils/constants";

interface ProjectListProps {
  onCreateClick?: () => void;
}

export default function ProjectList({ onCreateClick }: ProjectListProps) {
  const [status, setStatus] = useState<string>("");

  // Query hook: fetches projects filtered by selected status
  const { projects, isPending } = useClientProjects(
    status ? { status: status as ProjectStatus } : undefined,
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header & Status Filter Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl">
        <SubHeading
          title="Workspace Projects"
          description={
            isPending
              ? "Syncing workspaces..."
              : `${projects.length} project${projects.length !== 1 ? "s" : ""} found`
          }
          icon={Projects}
          iconClassName="text-indigo-600 dark:text-indigo-400"
          iconBgColor="bg-indigo-50 dark:bg-indigo-500/20"
        />

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
            {projects.map((project: Project, idx: number) => (
              <ProjectCard key={project.id} project={project} idx={idx} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
