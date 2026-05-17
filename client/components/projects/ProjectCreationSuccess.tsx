import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import VariantButton from "@/common/VariantButton";
import { ArrowLeft, Check } from "@/svg/Common";

interface ProjectCreationSuccessProps {
  onComplete: () => void;
}

export default function ProjectCreationSuccess({
  onComplete,
}: ProjectCreationSuccessProps) {
  const [countdown, setCountdown] = useState(3);

  // Automatic redirect ticking timer
  useEffect(() => {
    if (countdown === 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, onComplete]);

  return (
    <div className="relative overflow-hidden w-full mx-auto py-12 px-6 sm:px-10 bg-zinc-50/50 dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center">
      {/* Subtle Top Green Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-emerald-500/10 dark:bg-emerald-500/[0.07] blur-[60px] pointer-events-none rounded-full" />

      {/* Sleek Professional Success Icon */}
      <div className="relative mb-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full"
        >
          <Check className="w-8 h-8 stroke-[2.5]" />
        </motion.div>
      </div>

      {/* Typography Section */}
      <motion.h2
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2"
      >
        Project Launched Successfully!
      </motion.h2>

      <motion.p
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed font-normal"
      >
        Your new project workspace is registered, and secure smart escrow
        channels are now active.
      </motion.p>

      {/* Status & Action Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex flex-col items-center gap-4 w-full"
      >
        {/* Minimalist Redirect Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Redirecting to feed in</span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">
            {countdown}s
          </span>
        </div>

        {/* Action Button */}
        <div className="w-full max-w-xs mt-2">
          <VariantButton
            label="Go to Workspaces"
            variant="save"
            onClick={onComplete}
            icon={ArrowLeft}
          />
        </div>
      </motion.div>
    </div>
  );
}
