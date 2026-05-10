"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useResendVerify, getErrorMessage } from "@/hooks/useAuth";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import ResendEmail from "@/components/auth/ResendEmail";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail } from "@/svg/Common";
import { toast } from "sonner";
import BackButton from "@/common/BackButton";

const resendSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ResendFormData = z.infer<typeof resendSchema>;

export default function ResendVerificationEmailPage() {
  const [isSent, setIsSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const { resendVerifyAsync, isPending } = useResendVerify();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
  });

  // Handle countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onSubmit = async (data: ResendFormData) => {
    try {
      await resendVerifyAsync(data);
      setSubmittedEmail(data.email);
      setIsSent(true);
      setCountdown(60); // Start 60s cooldown
      toast.success("Verification email sent!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isPending) return;
    try {
      await resendVerifyAsync({ email: submittedEmail });
      setCountdown(60);
      toast.success("Verification email resent!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (isSent) {
    return (
      <ResendEmail
        email={submittedEmail}
        onResend={handleResend}
        isResending={isPending}
        countdown={countdown}
        onBack={() => router.push("/auth/login")}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
            <Mail className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Resend Verification
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter your email address and we'll send you a new link to verify your
          account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@example.com"
          register={register}
          error={errors.email?.message}
          variant="form"
        />

        <Submit type="submit" loading={isPending}>
          Send Verification Link
        </Submit>

        <BackButton
          type="button"
          label="Back to login"
          onClick={() => router.push("/auth/login")}
          className="w-full flex items-center justify-center"
        />
      </form>
    </motion.div>
  );
}
