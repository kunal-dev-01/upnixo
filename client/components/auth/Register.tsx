"use client";

import { useFormContext } from "react-hook-form";
import type { RegisterSchema } from "@/schemas/auth.schema";
import Input from "@/common/Input";
import PasswordStrength from "@/common/PasswordStrength";
import Submit from "@/common/SubmitButton";
import { motion } from "framer-motion";
import BackButton from "@/common/BackButton";
import Link from "next/link";

interface RegisterFormProps {
  isLoading: boolean;
  onBack: () => void;
}

export default function RegisterForm({ isLoading, onBack }: RegisterFormProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<RegisterSchema>();

  const password = watch("password");

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
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
      className="space-y-6"
    >
      <motion.div
        variants={itemVariants}
        className="space-y-2 mx-auto text-center"
      >
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Join us and start managing your portfolio professionally.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          name="full_name"
          placeholder="John Doe"
          register={register}
          error={errors.full_name?.message}
          disabled={isLoading}
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          placeholder="john@example.com"
          register={register}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <div className="space-y-2">
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            register={register}
            error={errors.password?.message}
            disabled={isLoading}
          />
          <PasswordStrength password={password} />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-2 space-y-4">
        <Submit loading={isLoading}>Create Account</Submit>

        <div className=" flex flex-col gap-4">
          <BackButton
            label="Back to options"
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="w-full flex items-center justify-center text-center py-2"
          />

          <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-indigo-500 dark:text-indigo-400 hover:underline font-semibold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
