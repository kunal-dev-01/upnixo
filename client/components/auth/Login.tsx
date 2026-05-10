import { useFormContext } from "react-hook-form";
import type { LoginSchema } from "@/schemas/auth.schema";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import BackButton from "@/common/BackButton";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MonoButton from "@/common/MonoButton";
import { TriangleAlert } from "@/svg/Common";

interface LoginFormProps {
  isLoading: boolean;
  onBack: () => void;
}

export default function LoginForm({ isLoading, onBack }: LoginFormProps) {
  const router = useRouter();
  const {
    register,
    formState: { errors },
  } = useFormContext<LoginSchema>();

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
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Welcome Back
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter your credentials to access your account.
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

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            register={register}
            error={errors.password?.message}
            disabled={isLoading}
          />
          <div className="flex justify-end px-1 mt-5">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-2 space-y-4">
        <Submit loading={isLoading}>Sign In</Submit>

        <div className="flex flex-col gap-4">
          <BackButton
            label="Back to options"
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="w-full flex items-center justify-center text-center py-2"
          />

          <div className="p-4 border border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-400">
                <TriangleAlert className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                  Not verified?
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Resend verification link
                </span>
              </div>
            </div>

            <MonoButton
              type="button"
              onClick={() => router.push("/auth/resend-verification-email")}
              className="px-4 py-2 text-[12px] h-9"
            >
              Resend
            </MonoButton>
          </div>

          <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-indigo-500 dark:text-indigo-400 hover:underline font-semibold"
            >
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
