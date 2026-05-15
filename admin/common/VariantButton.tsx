import React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { WavyText } from "@/components/footer/Footer";
import { Loader } from "./Loader";

type ButtonVariant = "default" | "save" | "delete" | "info";

interface VariantButtonProps extends HTMLMotionProps<"button"> {
  icon?: React.ElementType;
  variant?: ButtonVariant;
  isLoading?: boolean;
  label: string;
}

const variantBgConfig: Record<ButtonVariant, string> = {
  default: "from-zinc-200 to-zinc-400 dark:from-zinc-700 dark:to-zinc-900",
  save: "from-indigo-400 to-indigo-600",
  delete: "from-red-400 to-red-600",
  info: "from-yellow-400 to-yellow-600",
};

// Initial text/icon colors based on variant
const variantTextConfig: Record<ButtonVariant, string> = {
  default: "text-zinc-600 dark:text-zinc-400",
  save: "text-indigo-600 dark:text-indigo-400",
  delete: "text-red-600 dark:text-red-400",
  info: "text-yellow-600 dark:text-yellow-400",
};

const VariantButton = ({
  icon: Icon,
  label,
  variant = "default",
  isLoading = false,
  disabled,
  className,
  ...props
}: VariantButtonProps) => {
  const isDisabled = disabled || isLoading;

  return (
    <div className="relative group p-0.5 rounded-2xl overflow-hidden transition-all duration-300 w-full">
      {/* Background Gradient Layer */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-r ${variantBgConfig[variant]}`}
      />

      {/* Main Button */}
      <motion.button
        initial="initial"
        whileHover={!isDisabled ? "hover" : ""}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        disabled={isDisabled}
        className={`
          relative px-6 py-2 rounded-2xl border border-zinc-300/40 dark:border-zinc-700/40 w-full
          bg-white dark:bg-zinc-950 font-bold text-base tracking-tight
          flex items-center justify-center overflow-hidden z-20
          transition-all duration-300
          ${!isDisabled ? "group-hover:text-zinc-900 dark:group-hover:text-white" : ""}
          ${variantTextConfig[variant]}
          ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}
        `}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 text-zinc-900 dark:text-white"
            >
              <Loader className="w-4 h-4" />
              <span className="text-sm">Processing...</span>
            </motion.div>
          ) : (
            <div className="flex items-center gap-2.5">
              {Icon && <Icon className="h-5 w-5 stroke-[2.5]" />}
              <WavyText name={label} />
            </div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default VariantButton;
