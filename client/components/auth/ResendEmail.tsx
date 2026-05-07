"use client";

import BackButton from "@/common/BackButton";
import CountdownButton from "@/common/CountdownButton";
import { Mail, Refresh, ArrowLeft } from "@/svg/Common";
import { motion } from "framer-motion";

interface ResendEmailProps {
  email: string;
  onResend: () => void;
  isResending: boolean;
  countdown: number;
  onBack: () => void;
}

export default function ResendEmail({
  email,
  onResend,
  isResending,
  countdown,
  onBack,
}: ResendEmailProps) {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="text-center space-y-8"
    >
      <motion.div variants={itemVariants} className="flex justify-center">
        <div className="relative">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center"
          >
            <Mail className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-zinc-950 rounded-full"
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Verify your email
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed px-4">
          We've sent a verification link to <br />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md mt-1 inline-block">
            {email}
          </span>
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-4 space-y-4">
        <CountdownButton
          onClick={onResend}
          isLoading={isResending}
          countdown={countdown}
          icon={<Refresh className="w-4 h-4" />}
        />

        <BackButton
          label="Back to registration"
          type="button"
          onClick={onBack}
          className="py-2 flex items-center justify-center w-full "
        />
      </motion.div>

      <motion.div variants={itemVariants} className="pt-3 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
            Troubleshooting
          </p>
          <div className="h-0.5 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        </div>

        <ul className="text-[11px] text-zinc-400 dark:text-zinc-500 space-y-2  mx-auto">
          <li className="flex items-start gap-2 text-left">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
            <span>
              Check your{" "}
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                Spam or Junk
              </span>{" "}
              folder — sometimes filters misplace important mail.
            </span>
          </li>
          <li className="flex items-start gap-2 text-left">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
            <span>
              Verify that{" "}
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                {email}
              </span>{" "}
              is your correct email address.
            </span>
          </li>
          <li className="flex items-start gap-2 text-left">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-indigo-500" />
            <span>
              Wait at least{" "}
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                2-5 minutes
              </span>{" "}
              as delivery can sometimes be delayed.
            </span>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
