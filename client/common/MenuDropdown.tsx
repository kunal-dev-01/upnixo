import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical } from "@/svg/More";

export interface MenuOption {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
}

interface MenuDropdownProps {
  options: MenuOption[];
  disabled?: boolean;
  className?: string;
}

const MenuDropdown = memo(
  ({ options, disabled = false, className = "" }: MenuDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }, []);

    useEffect(() => {
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, handleClickOutside]);

    const toggleDropdown = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!disabled) setIsOpen((prev) => !prev);
      },
      [disabled],
    );

    return (
      <div
        className={`relative inline-block text-left ${className}`}
        ref={containerRef}
      >
        {/* Trigger Button */}
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={`
          p-2 rounded-xl transition-all duration-200 outline-none flex items-center justify-center
          text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100
          hover:bg-neutral-100 dark:hover:bg-neutral-800
          ${isOpen ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              // Changed: Removed w-48, Added min-w-[12rem] w-max
              className="absolute right-0 mt-2 z-50 min-w-48 w-max bg-white/90 dark:bg-neutral-900/90 rounded-2xl overflow-hidden origin-top-right py-2 border border-zinc-100 dark:border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <ul className="flex flex-col gap-1 px-2">
                {options.map((option, idx) => {
                  const Icon = option.icon;

                  const variantClasses = {
                    default:
                      "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 hover:text-neutral-900 dark:hover:text-white",
                    danger:
                      "text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300",
                    success:
                      "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300",
                  };

                  const currentVariant = option.variant || "default";

                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => {
                          e.stopPropagation();
                          option.onClick();
                          setIsOpen(false);
                        }}
                        className={`
                        w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-left cursor-pointer
                        ${variantClasses[currentVariant]}
                      `}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {/* Changed: Added whitespace-nowrap to prevent text wrapping */}
                        <span className="whitespace-nowrap">
                          {option.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

MenuDropdown.displayName = "MenuDropdown";
export default MenuDropdown;
