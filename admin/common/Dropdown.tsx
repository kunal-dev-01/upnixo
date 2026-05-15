import { ChevronDown } from "@/svg/Common";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const Dropdown = ({
  label,
  options,
  value,
  onChange,
  disabled,
  className,
  placeholder = "Select Option",
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative flex-1" ref={containerRef}>
      {label && (
        <label className="block text-sm font-semibold tracking-wider text-zinc-700 dark:text-zinc-200 ml-1 mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between p-3 border rounded-2xl 
          transition-all duration-300 outline-none group
          ${
            isOpen
              ? "border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.1)] dark:border-indigo-500"
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900/50"
          } 
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 
          ${className}
        `}
      >
        <span
          className={`text-sm font-semibold transition-colors ${
            selectedOption
              ? "text-zinc-900 dark:text-zinc-100"
              : "text-zinc-400"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div
          className={`rounded-lg transition-colors ${isOpen ? "bg-indigo-50 dark:bg-indigo-500/10" : "bg-transparent"}`}
        >
          <ChevronDown
            className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-300 ease-out ${
              isOpen ? "rotate-180 text-indigo-500" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu with Framer Motion */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute z-60 w-full mt-3 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden origin-top"
          >
            <ul className="max-h-64 overflow-auto py-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {options.map((option) => {
                const isSelected = value === option.value;
                return (
                  <li key={option.value} className="px-2">
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all
                        ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                        }
                      `}
                    >
                      {option.label}
                      {isSelected && (
                        <motion.div layoutId="active-tick">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full fill-current" />
                        </motion.div>
                      )}
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
};

export default Dropdown;
