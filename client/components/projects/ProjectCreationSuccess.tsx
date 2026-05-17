import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import VariantButton from "@/common/VariantButton";
import { Check } from "@/svg/Common";

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
    <div className="w-full max-w-lg mx-auto py-16 px-6 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl flex flex-col items-center justify-center text-center shadow-lg">
      {/* Animated Success Badge with pulsing circles */}
      <div className="relative mb-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.4, opacity: 0.15 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 bg-emerald-500 rounded-full"
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.8, opacity: 0.05 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.5,
          }}
          className="absolute inset-0 bg-emerald-500 rounded-full"
        />

        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          className="relative p-6 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500 border border-emerald-500/20 rounded-full shadow-lg shadow-emerald-500/5"
        >
          <Check className="w-12 h-12 stroke-3" />
        </motion.div>
      </div>

      {/* Celebration heading & descriptive details */}
      <motion.h2
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-3"
      >
        Project Launched successfully!
      </motion.h2>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-10 leading-relaxed"
      >
        Apka new project workspace register ho chuka hai aur secure smart escrow
        channels activate kar diye gaye hain.
      </motion.p>

      {/* Countdown overlay indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col items-center gap-4 w-full"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Redirecting to your feed in</span>
          <span className="font-extrabold text-indigo-500 text-sm w-4 text-center">
            {countdown}
          </span>
          <span>second{countdown !== 1 ? "s" : ""}...</span>
        </div>

        {/* Fallback instant workspace entry action */}
        <div className="w-full max-w-xs mt-2">
          <VariantButton
            label="Go to Workspaces"
            variant="save"
            onClick={onComplete}
          />
        </div>
      </motion.div>
    </div>
  );
}
