"use client";

import { useFormContext } from "react-hook-form";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import BackButton from "@/common/BackButton";
import { Shield, Refresh } from "@/svg/Common";
import { motion, AnimatePresence } from "framer-motion";

interface VerifyTwoFAProps {
  isLoading: boolean;
  onBack: () => void;
  isBackupMode: boolean;
  setIsBackupMode: (val: boolean) => void;
}

export default function VerifyTwoFA({
  isLoading,
  onBack,
  isBackupMode,
  setIsBackupMode,
}: VerifyTwoFAProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

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
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex justify-center">
        <div className="relative">
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center"
          >
            <Shield className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 border-4 border-white dark:border-zinc-950 rounded-full animate-pulse" />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Two-Factor Authentication
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed px-4">
          {isBackupMode
            ? "Enter one of your 8-digit backup codes to access your account."
            : "Enter the 6-digit verification code from your authenticator app."}
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <AnimatePresence mode="wait">
          {isBackupMode ? (
            <motion.div
              key="backup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Input
                label="Backup Code"
                type="text"
                name="backup_code"
                placeholder="Enter 8-digit code"
                register={register}
                error={(errors as any).backup_code?.message}
                disabled={isLoading}
                maxLength={8}
              />
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Input
                label="Verification Code"
                type="text"
                name="code"
                placeholder="000000"
                register={register}
                error={(errors as any).code?.message}
                disabled={isLoading}
                maxLength={6}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setIsBackupMode(!isBackupMode)}
          disabled={isLoading}
          className="flex items-center gap-2 text-md font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors px-1 mt-2 hover:underline"
        >
          <Refresh className="w-4.5 h-4.5" />
          {isBackupMode ? "Use authenticator app" : "Use backup code"}
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-2 space-y-4">
        <Submit type="submit" loading={isLoading}>
          {isBackupMode ? "Verify Backup Code" : "Verify OTP"}
        </Submit>

        <BackButton
          label="Back to login"
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="py-2 flex items-center justify-center w-full"
        />
      </motion.div>
    </motion.div>
  );
}
