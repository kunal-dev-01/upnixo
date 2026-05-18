import { motion } from "framer-motion";
import type { Project } from "@/types/project.types";
import { STATUS_CONFIG } from "@/utils/constants";
import { Bolt, Wallet, Github } from "@/svg/More";
import { Check, TriangleAlert, Edit, EyeOpen } from "@/svg/Common";
import { formatCurrency, formatDate } from "@/utils/formats";
import MenuDropdown, { type MenuOption } from "@/common/MenuDropdown";
import { useRouter } from "next/navigation";

interface ProjectCardProps {
  project: Project;
  idx: number;
  onUpdate?: (project: Project) => void;
}

export default function ProjectCard({
  project,
  idx,
  onUpdate,
}: ProjectCardProps) {
  const router = useRouter();
  const config = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;

  const dropdownOptions: MenuOption[] = [
    {
      label: "Update Project",
      icon: Edit,
      onClick: () => {
        router.push(`/projects/update?slug=${project.slug}`);
      },
    },
    {
      label: "View Details",
      icon: EyeOpen,
      onClick: () => {
        router.push(`/projects/details?slug=${project.slug}`);
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          delay: idx * 0.04,
          ease: [0.215, 0.61, 0.355, 1],
        },
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative p-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex flex-col justify-between hover:border-zinc-200/80 dark:hover:border-zinc-800 transition-colors duration-500 ease-in-out cursor-default group overflow-hidden"
    >
      {/* Premium Top Subtle Accent Line on Hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-indigo-500/0 via-indigo-500/40 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out" />

      <div>
        {/* Header Row */}
        <div className="flex justify-between items-center gap-4 mb-4">
          <span
            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md border ${config.bg} ${config.text} ${config.border}`}
          >
            {config.label}
          </span>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-md bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <Bolt className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
              <span>Priority {project.priority}</span>
            </div>

            <MenuDropdown options={dropdownOptions} />
          </div>
        </div>

        {/* Main Details */}
        <div className="flex flex-col gap-1.5 mb-5">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors wrap-break-word">
            {project.title}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-zinc-100/80 dark:border-zinc-900/80 mb-4 bg-zinc-50/30 dark:bg-zinc-900/20 px-3 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider leading-none mb-0.5">
              Budget
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
              {formatCurrency(project.budget, project.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-l border-zinc-100 dark:border-zinc-900 pl-3">
          <div
            className={`p-1.5 rounded-lg ${
              project.is_escrow_funded
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {project.is_escrow_funded ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <TriangleAlert className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider leading-none mb-0.5">
              Escrow
            </span>
            <span
              className={`text-xs font-semibold ${
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
      <div className="flex justify-between items-center text-[11px] sm:text-xs">
        <div className="flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
          <span>Timeline:</span>
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            {formatDate(project.deadline_at)}
          </span>
        </div>

        {project.repository_url && (
          <a
            href={project.repository_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Repository</span>
          </a>
        )}
      </div>
    </motion.div>
  );
}
