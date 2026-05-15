import { useFormContext } from "react-hook-form";
import type { VerifyFormValues } from "@/schemas/auth.schema";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import BackButton from "@/common/BackButton";
import { motion } from "framer-motion";
import { Mail } from "@/svg/Common";

interface LoginVerifyProps {
  email: string;
  isLoading: boolean;
  onBack: () => void;
}

export default function LoginVerify({
  email,
  isLoading,
  onBack,
}: LoginVerifyProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<VerifyFormValues>();

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
          <Mail className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Verify Identity
        </h1>
        <div className="space-y-1">
          <p className="text-sm text-zinc-400">
            A verification code has been sent to
          </p>
          <p className="text-sm font-semibold text-indigo-400 italic">
            {email}
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-4">
        <Input
          label="Verification Code"
          type="text"
          name="code"
          placeholder="000000"
          maxLength={6}
          register={register}
          error={errors.code?.message}
          disabled={isLoading}
          className="text-center tracking-[0.5em] text-xl font-bold"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="pt-2 space-y-4">
        <Submit loading={isLoading}>Verify & Login</Submit>

        <div className="flex justify-center pt-2">
          <BackButton
            label="Back to login"
            type="button"
            onClick={onBack}
            disabled={isLoading}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="text-center pt-4">
        <p className="text-xs text-zinc-500">
          Didn't receive the code? Check your spam folder or wait a few minutes.
        </p>
      </motion.div>
    </motion.div>
  );
}
