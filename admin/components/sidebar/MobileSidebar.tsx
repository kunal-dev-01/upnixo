import { useRouter } from "next/navigation";
import { Sidebar, X } from "@/svg/Common";
import { DASHBOARD_LINKS } from "@/utils/constants";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/utils/Initials";
import Logo from "../logo/Logo";

export function MobileHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="md:hidden fixed top-4 left-4 right-4 z-40 flex items-center justify-between pl-3 pr-1 py-1 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-lg border border-zinc-200 dark:border-zinc-800 rounded-full">
      <Logo />

      <button
        onClick={onOpenMenu}
        className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-full text-zinc-600 dark:text-zinc-300"
      >
        <Sidebar className="w-6 h-6" />
      </button>
    </header>
  );
}

export function MobileSidebar({
  isOpen,
  onClose,
  pathname,
}: {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const router = useRouter();
  const { admin } = useAuthStore();

  return (
    <>
      <div
        className={`md:hidden fixed inset-0 z-50 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity ${isOpen ? "opacity-100 visible fade-in" : "opacity-0 invisible"}`}
        onClick={onClose}
      />
      <aside
        className={`md:hidden flex flex-col fixed top-0 right-0 h-full w-60 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 z-50 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 flex items-center justify-between">
          <Logo />

          <button
            onClick={onClose}
            className="p-3 py-1.5 bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 px-3 mt-2 overflow-y-auto">
          {DASHBOARD_LINKS.map((link) => {
            const isActive = pathname === link.href;

            return (
              <button
                key={link.name}
                onClick={() => {
                  router.push(link.href);
                  onClose();
                }}
                className={`relative w-full text-start flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 group z-10 ${
                  isActive
                    ? "text-zinc-800 dark:text-zinc-200"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {/* SAME BACKGROUND & HOVER EFFECT FOR MOBILE */}
                <div
                  className={`absolute inset-0 rounded-2xl -z-10 transition-all duration-200 ease-out outline-none ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-900 scale-100 opacity-100"
                      : "bg-zinc-100 dark:bg-zinc-900 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                  }`}
                />

                <div className="shrink-0">{link.icon}</div>
                <span className="font-bold">{link.name}</span>
              </button>
            );
          })}
        </nav>

        {/* ================= USER PROFILE SECTION (BOTTOM) ================= */}
        {admin && (
          <div className="p-3 mt-auto border-t border-zinc-100 dark:border-zinc-800/50 shrink-0">
            <button
              onClick={() => {
                router.push("/account");
                onClose();
              }}
              className="flex items-center w-full gap-3 p-2 rounded-4xl bg-zinc-100 dark:bg-zinc-800/50 transition-colors cursor-pointer overflow-hidden group text-left"
            >
              {/* Avatar / Fallback Design */}
              <div className="w-9 h-9 rounded-full bg-zinc-200/80 dark:bg-zinc-900   flex items-center justify-center shrink-0 dark:text-white text-zinc-800 font-bold text-xs ring-2 ring-zinc-300 dark:ring-zinc-800">
                {admin && <span>{getInitials(admin.full_name)}</span>}
              </div>

              {/* Truncated Name & Role */}
              <div className="flex flex-col items-start overflow-hidden flex-1 ">
                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                  {admin.full_name}
                </p>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate w-30">
                  {admin.email}
                </span>
              </div>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
