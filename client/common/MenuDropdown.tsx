import { useState, useRef, useEffect } from "react";
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

export default function MenuDropdown({
  options,
  disabled = false,
  className = "",
}: MenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card trigger clicks
    if (disabled) return;
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 
          bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900/60 
          border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800
          rounded-xl transition-all duration-300 outline-none cursor-pointer flex items-center justify-center
          ${isOpen ? "bg-zinc-100 border-zinc-200 dark:bg-zinc-900/80 dark:border-zinc-800 text-indigo-500 dark:text-indigo-400" : ""}
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        `}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu Option List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 z-70 w-48 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-xl overflow-hidden origin-top-right py-1.5"
            onClick={(e) => e.stopPropagation()} // Stop propagation from bubbling to parent cards
          >
            <ul className="flex flex-col gap-0.5 px-1.5">
              {options.map((option, idx) => {
                const Icon = option.icon;
                
                // Color variants for options
                const variantClasses = {
                  default: "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-white",
                  danger: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300",
                  success: "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-700 dark:hover:text-emerald-300",
                };

                const currentVariant = option.variant || "default";

                return (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        option.onClick();
                        setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 text-left cursor-pointer
                        ${variantClasses[currentVariant]}
                      `}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{option.label}</span>
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
}
