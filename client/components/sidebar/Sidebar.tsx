import { useEffect } from "react";
import Link from "next/link";
import { NAV_LINKS } from "@/utils/constants";
import { X } from "@/svg/Common";
import Logo from "../logo/Logo";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Background Overlay */}
      <div
        className={`fixed inset-0 z-60 bg-zinc-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 right-0 z-70 h-full w-[80%] max-w-sm bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Logo />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={onClose}
                className="text-lg font-medium text-zinc-600 dark:text-zinc-400 transition-colors px-3 py-2 rounded-full bg-zinc-100 dark:bg-zinc-900/50"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Bottom Auth Actions */}
          <div className="mt-auto flex flex-col gap-3">
            <Link
              href="/auth/login"
              onClick={onClose}
              className="flex items-center justify-center text-base font-medium bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 px-4 py-3 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all duration-300"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              onClick={onClose}
              className="flex items-center justify-center text-base font-semibold px-4 py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-300"
            >
              Start a Project
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
