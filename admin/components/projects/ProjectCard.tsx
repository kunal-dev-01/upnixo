import { memo } from "react";
import type { Project } from "@/types/project.types";
import MenuDropdown, { MenuOption } from "@/common/MenuDropdown";
import MonoButton from "@/common/MonoButton";
import { formatDate } from "@/utils/formats";
import { toast } from "sonner";
import { EyeOpen, Refresh, Trash, User } from "@/svg/Common";
import { STATUS_CONFIG } from "@/utils/constants";
import { Credits, Pen } from "@/svg/Auth";
import { Bolt, Github, Projects } from "@/svg/More";
import { Calendar } from "@/svg/Extra";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface ProjectCardProps {
  project: Project;
  onStatusChangeTrigger: (project: Project) => void;
  onDeleteTrigger: (project: Project) => void;
}

const ProjectCard = memo(
  ({ project, onStatusChangeTrigger, onDeleteTrigger }: ProjectCardProps) => {
    const router = useRouter();

    const handleCopySlug = () => {
      navigator.clipboard.writeText(project.slug);
      toast.success("Project slug copied!");
    };

    const menuOptions: MenuOption[] = [
      {
        label: "See Project",
        icon: EyeOpen,
        onClick: () => router.push(`/projects/${project.slug}`),
        variant: "default",
      },
      ...(project.repository_url
        ? [
            {
              label: "View Repository",
              icon: Github,
              onClick: () =>
                window.open(project.repository_url as string, "_blank"),
              variant: "default" as const,
            },
          ]
        : []),
      {
        label: "Update Details",
        icon: Pen,
        onClick: () => router.push(`/projects/${project.slug}`),
        variant: "default",
      },
      {
        label: "Update Status",
        icon: Refresh,
        onClick: () => onStatusChangeTrigger(project),
        variant: "success",
      },
      {
        label: "Delete Project",
        icon: Trash,
        onClick: () => onDeleteTrigger(project),
        variant: "danger",
      },
    ];

    const formatCurrency = (val: string, currency: string) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) return `${val} ${currency}`;
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 0,
      }).format(parsed);
    };

    // Project status ke base par config select karna
    const currentStatus = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;

    return (
      <div
        className={`
        relative overflow-hidden p-6 rounded-3xl transition-all duration-300 border bg-zinc-950 flex flex-col justify-between h-full group shadow-none
        ${
          project.status === "cancelled"
            ? "border-red-500/10"
            : "border-zinc-900 hover:border-zinc-800"
        }
      `}
      >
        {/* Dynamic top gradient bar */}
        <div
          className={`
          absolute top-0 left-0 w-full h-[3px] transition-all duration-300
          ${project.status === "cancelled" ? "bg-red-500" : "bg-zinc-900 group-hover:bg-indigo-500"}
        `}
        />

        <div className="space-y-6">
          {/* Row 1: Profile-style header & Actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shrink-0">
                <Projects />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-extrabold text-white tracking-tight line-clamp-1">
                    {project.title}
                  </h4>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-lg border ${currentStatus.bg} ${currentStatus.border} ${currentStatus.text}`}
                  >
                    {currentStatus.label}
                  </span>
                </div>

                <div
                  onClick={handleCopySlug}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 select-all font-medium cursor-pointer hover:text-zinc-350 transition-colors"
                >
                  <span className="line-clamp-1 break-all font-mono">
                    #{project.slug}
                  </span>
                </div>
              </div>
            </div>

            <MenuDropdown options={menuOptions} />
          </div>

          {/* Row 2: Description */}
          <div className="text-left">
            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
              {project.description || "No project description provided."}
            </p>
          </div>

          {/* Row 3: Grid Metadata */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-zinc-900 text-sm text-left">
            {/* Budget */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Project Budget
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <Credits className="w-4.5 h-4.5" />
                <span>{formatCurrency(project.budget, project.currency)}</span>
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Target Deadline
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <Calendar className="w-4.5 h-4.5" />
                <span>{formatDate(project.deadline_at)}</span>
              </div>
            </div>

            {/* Client Owner */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Client Owner
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <User className="h-4.5 w-4.5" />
                <span className="truncate" title={project.client_id}>
                  ID-{project.client_id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Assigned Expert */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Assigned Expert
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <User className="h-4.5 w-4.5" />
                <span className="truncate">
                  {project.freelancer_id
                    ? `ID-${project.freelancer_id.slice(-8).toUpperCase()}`
                    : "Unassigned"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info control row */}
        <div className="mt-6 flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-xs font-bold text-zinc-300 block">
              Priority Status
            </span>
            {/* Priority Badge with Bolt SVG */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 w-fit rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase tracking-wider">
              <Bolt className="w-3 h-3 text-indigo-400" />
              <span>Rank {project.priority}</span>
            </div>
          </div>

          {/* Tumhara custom MonoButton (Dark mode classes automatically work) */}
          <div className="w-fit">
            <MonoButton onClick={() => onStatusChangeTrigger(project)}>
              <Refresh />
              <span>Update Status</span>
            </MonoButton>
          </div>
        </div>
      </div>
    );
  },
);

ProjectCard.displayName = "ProjectCard";
export default ProjectCard;
