import { useRouter } from "next/navigation";
import { Pin } from "@/svg/More";
import { DASHBOARD_LINKS } from "@/utils/constants";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/utils/Initials";

interface DesktopSidebarProps {
  isExpanded: boolean;
  isPinned: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  togglePin: () => void;
  pathname: string;
}

export function DesktopSidebar({
  isExpanded,
  isPinned,
  onMouseEnter,
  onMouseLeave,
  togglePin,
  pathname,
}: DesktopSidebarProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`hidden md:flex flex-col fixed left-0 top-0 h-screen cursor-pointer border-r border-zinc-200 dark:border-zinc-900 transition-all duration-300 ease-in-out z-40 ${
        isExpanded ? "w-56" : "w-16"
      }`}
    >
      {/* HEADER SECTION */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800/50">
        <div className="flex items-center gap-0 overflow-hidden whitespace-nowrap">
          <img src="/logo.svg" alt="Logo" className="size-6 shrink-0" />
          <span
            className={`font-bold text-2xl text-zinc-700 dark:text-zinc-200 capitalize transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0"}`}
          >
            Pnixo
          </span>
        </div>

        {isExpanded && (
          <button
            onClick={togglePin}
            className={`px-2.5 py-1 rounded-full transition-colors border ${isPinned ? "dark:text-zinc-300 text-zinc-600 bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-900" : "dark:text-zinc-400 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-900"} cursor-pointer`}
          >
            <Pin />
          </button>
        )}
      </div>

      {/* NAVIGATION SECTION */}
      <nav className="flex-1 flex flex-col gap-1.5 px-2 py-4 overflow-hidden">
        {DASHBOARD_LINKS.map((link) => {
          const isActive = pathname === link.href;

          return (
            <button
              key={link.name}
              onClick={() => router.push(link.href)}
              className={`relative flex items-center px-2 py-1.5 rounded-2xl transition-all duration-200 group whitespace-nowrap cursor-pointer z-10 ${
                isActive
                  ? "text-zinc-800 dark:text-zinc-200"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {/* === ABSOLUTE BACKGROUND WITH HOVER SCALE EFFECT === */}
              <div
                className={`absolute inset-0 rounded-2xl -z-10 transition-all duration-200 ease-out outline-none ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-900 scale-100 opacity-100"
                    : "bg-zinc-100 dark:bg-zinc-900 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                }`}
              />

              {/* ICONS AND TEXT */}
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                {link.icon}
              </div>
              <span
                className={`ml-2 text-sm font-bold transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0 w-0"}`}
              >
                {link.name}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ================= USER PROFILE SECTION (BOTTOM) ================= */}
      {user && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-900">
          <button
            onClick={() => router.push("/account")}
            className="flex items-center w-full gap-3 p-1 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer overflow-hidden group"
          >
            {/* Avatar / Fallback Design */}
            <div className="w-8 h-8 rounded-full bg-zinc-200/80 dark:bg-zinc-900   flex items-center justify-center shrink-0 dark:text-white text-zinc-800 font-bold text-xs ring-2 ring-zinc-300 dark:ring-zinc-800">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{getInitials(user.full_name)}</span>
              )}
            </div>

            {/* Truncated Name & Role */}
            <div
              className={`flex flex-col items-start text-left transition-opacity duration-300 overflow-hidden ${isExpanded ? "opacity-100 w-full" : "opacity-0 w-0"}`}
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {user.full_name}
              </p>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate lg:w-30 md:w-26">
                {user.email}
              </span>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}
