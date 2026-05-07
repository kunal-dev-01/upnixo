"use client";

import { SimpleCheck } from "@/svg/Common";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ResetSuccess() {
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
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 dark:text-emerald-400"
          >
            <SimpleCheck className="w-10 h-10" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Password Reset!
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed px-4">
          Your password has been successfully updated. You can now sign in with
          your new credentials.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-4">
        <Link
          href="/auth/login"
          className="flex items-center justify-center w-full py-2 px-6 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-full transition-all duration-300"
        >
          Sign In to Your Account
        </Link>
      </motion.div>
    </motion.div>
  );
}
