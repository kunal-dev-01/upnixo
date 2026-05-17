import { motion } from "framer-motion";
import type { Project } from "@/types/project.types";
import { STATUS_CONFIG } from "@/utils/constants";
import { Bolt, Wallet, Github } from "@/svg/More";
import { Check, TriangleAlert } from "@/svg/Common";
import { formatCurrency, formatDate } from "@/utils/formats";

interface ProjectCardProps {
  project: Project;
  idx: number;
}

export default function ProjectCard({ project, idx }: ProjectCardProps) {
  const config = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { delay: idx * 0.05 },
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative p-6 bg-white dark:bg-zinc-950 border border-zinc-200/90 dark:border-zinc-900 rounded-3xl flex flex-col justify-between shadow-xs transition-all hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_12px_24px_-10px_rgba(0,0,0,0.3)] group overflow-hidden"
    >
      {/* Glowing background hint */}
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-15 transition-opacity group-hover:opacity-25 bg-indigo-500" />

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
}
