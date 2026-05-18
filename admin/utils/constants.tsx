import { Credits, Dashboard, Users } from "@/svg/Auth";
import { Settings } from "@/svg/Common";
import { WebHook } from "@/svg/Extra";
import { Payment, Projects, Support } from "@/svg/More";
import { ProjectStatus } from "@/types/project.types";

export const DASHBOARD_LINKS = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <Dashboard className="w-5 h-5" />,
  },
  {
    name: "Clients",
    href: "/clients",
    icon: <Users className="w-6.5 h-6.5" />,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: <Projects className="w-6.5 h-6.5" />,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: <Payment className="w-6 h-6" />,
  },
  {
    name: "Subscriptions",
    href: "/subscriptions",
    icon: <Credits className="w-6 h-6" />,
  },
  {
    name: "Webhooks",
    href: "/webhooks",
    icon: <WebHook className="w-6 h-6" />,
  },
  { name: "Support", href: "/support", icon: <Support className="w-6 h-6" /> },
  {
    name: "Account",
    href: "/account",
    icon: <Settings className="w-6.5 h-6.5" />,
  },
];

export const STATUS_CONFIG: Record<
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

export const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "In Review", value: "in_review" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Disputed", value: "disputed" },
];
