"use client";

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  loginSchema,
  verify2FASchema,
  verifyBackupCodeSchema,
  type LoginSchema,
} from "@/schemas/auth.schema";
import {
  useLogin,
  useVerify2FA,
  useVerifyBackupCode,
  useGoogleLogin,
  useGitHubLogin,
} from "@/hooks/useAuth";
import { isTwoFAPending, isAuthSuccess } from "@/types/auth.types";
import { motion } from "framer-motion";

// Components
import WithMail from "@/common/WithMail";
import IconButton from "@/common/IconButton";
import LoginForm from "@/components/auth/Login";
import VerifyTwoFA from "@/components/auth/VerifyTwoFA";
import { Google } from "@/svg/Auth";
import { Github } from "@/svg/More";

type Step = "initial" | "form" | "2fa";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("initial");
  const [isBackupMode, setIsBackupMode] = useState(false);
  const router = useRouter();

  // Hooks
  const { login: googleLogin } = useGoogleLogin();
  const { login: githubLogin } = useGitHubLogin();
  const { login: loginUser, isPending: isLoggingIn } = useLogin();
  const { verify2FA, isPending: isVerifying2FA } = useVerify2FA();
  const { verifyBackupCode, isPending: isVerifyingBackup } =
    useVerifyBackupCode();

  // Forms
  const loginMethods = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const twoFAMethods = useForm({
    resolver: zodResolver(
      isBackupMode ? verifyBackupCodeSchema : verify2FASchema,
    ),
    defaultValues: { code: "", backup_code: "" },
  });

  // Re-sync resolver when mode changes
  useEffect(() => {
    twoFAMethods.reset();
  }, [isBackupMode, twoFAMethods]);

  // Handlers
  const onLogin = (data: LoginSchema) => {
    loginUser(data, {
      onSuccess: (response) => {
        if (isTwoFAPending(response)) {
          setStep("2fa");
          toast.info("Two-factor authentication required.");
          return;
        }
        if (isAuthSuccess(response)) {
          toast.success("Logged in successfully!");
          router.push("/dashboard");
        }
      },
      onError: (error) => {
        toast.error(
          error.message || "Login failed. Please check your credentials.",
        );
      },
    });
  };

  const onVerify2FA = (data: any) => {
    const pendingToken = sessionStorage.getItem("2fa_pending_token");
    if (!pendingToken) {
      toast.error("Session expired. Please login again.");
      setStep("form");
      return;
    }

    if (isBackupMode) {
      verifyBackupCode(
        { backup_code: data.backup_code, two_fa_pending_token: pendingToken },
        {
          onSuccess: () => {
            toast.success("Welcome back!");
            router.push("/dashboard");
          },
          onError: (error) => {
            toast.error(error.message || "Invalid backup code.");
          },
        },
      );
    } else {
      verify2FA(
        { code: data.code, two_fa_pending_token: pendingToken },
        {
          onSuccess: () => {
            toast.success("Authenticated successfully!");
            router.push("/dashboard");
          },
          onError: (error) => {
            toast.error(error.message || "Invalid verification code.");
          },
        },
      );
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
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
    <div className="w-full max-w-md mx-auto">
      {step === "initial" && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Sign in to your Upnixo account
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-4 pt-4">
            <WithMail onClick={() => setStep("form")} />

            <div className="relative flex items-center py-2">
              <div className="grow border-t border-zinc-200 dark:border-zinc-800"></div>
              <span className="shrink mx-4 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                Or continue with
              </span>
              <div className="grow border-t border-zinc-200 dark:border-zinc-800"></div>
            </div>

            <div className="grid grid-rows-2 gap-4">
              <IconButton
                Icon={Google}
                text="Continue with Google"
                onClick={() => googleLogin()}
              />
              <IconButton
                Icon={Github}
                text="Continue with Github"
                onClick={() => githubLogin()}
              />
            </div>
          </motion.div>
        </motion.div>
      )}

      {step === "form" && (
        <FormProvider {...loginMethods}>
          <form onSubmit={loginMethods.handleSubmit(onLogin)}>
            <LoginForm
              isLoading={isLoggingIn}
              onBack={() => setStep("initial")}
            />
          </form>
        </FormProvider>
      )}

      {step === "2fa" && (
        <FormProvider {...twoFAMethods}>
          <form onSubmit={twoFAMethods.handleSubmit(onVerify2FA)}>
            <VerifyTwoFA
              isLoading={isVerifying2FA || isVerifyingBackup}
              onBack={() => setStep("form")}
              isBackupMode={isBackupMode}
              setIsBackupMode={setIsBackupMode}
            />
          </form>
        </FormProvider>
      )}
    </div>
  );
}
