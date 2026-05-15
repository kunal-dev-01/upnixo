import { useFormContext } from "react-hook-form";
import type { LoginFormValues } from "@/schemas/auth.schema";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck } from "@/svg/More";

interface LoginFormProps {
  isLoading: boolean;
}

export default function LoginForm({ isLoading }: LoginFormProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<LoginFormValues>();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="space-y-2 text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Admin Portal
        </h1>
        <p className="text-sm text-zinc-400">
          Enter your administrative credentials to continue.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <Input
          label="Admin Email"
          type="email"
          name="email"
          placeholder="admin@upnixo.com"
          register={register}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          register={register}
          error={errors.password?.message}
          disabled={isLoading}
        />

        <Input
          label="Master Secret Key"
          type="password"
          name="master_secret_key"
          placeholder="Your secondary secret key"
          register={register}
          error={errors.master_secret_key?.message}
          disabled={isLoading}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="pt-2 space-y-4">
        <Submit loading={isLoading}>Authorize Access</Submit>

        <div className="flex justify-center">
          <Link
            href="/auth/forgot"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Forgot Credentials?
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
