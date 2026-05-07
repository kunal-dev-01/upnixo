"use client";

import { useFormContext } from "react-hook-form";
import type { ForgotPasswordSchema } from "@/schemas/auth.schema";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import BackButton from "@/common/BackButton";
import { motion } from "framer-motion";
import { Key } from "@/svg/Auth";

interface ForgotFormProps {
  isLoading: boolean;
  onBack: () => void;
}

export default function ForgotForm({ isLoading, onBack }: ForgotFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ForgotPasswordSchema>();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
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
        <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
          <Key className="w-8 h-8 text-indigo-600 dark:text-indigo-400 -rotate-12" />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Forgot Password?
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No worries! Enter your email and we'll send you a link to reset it.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="john@example.com"
          register={register}
          error={errors.email?.message}
          disabled={isLoading}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="pt-2 space-y-4">
        <Submit loading={isLoading}>Send Reset Link</Submit>

        <BackButton
          label="Back to login"
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="w-full flex items-center justify-center text-center py-2"
        />
      </motion.div>
    </motion.div>
  );
}
