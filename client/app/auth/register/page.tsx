"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterSchema } from "@/schemas/auth.schema";
import {
  useRegister,
  useResendVerify,
  useGoogleLogin,
  useGitHubLogin,
} from "@/hooks/useAuth";

// Components
import WithMail from "@/common/WithMail";
import IconButton from "@/common/IconButton";
import RegisterForm from "@/components/auth/Register";
import ResendEmail from "@/components/auth/ResendEmail";
import { Google } from "@/svg/Auth";
import { Github } from "@/svg/More";
import { User } from "@/svg/Common";

type Step = "initial" | "form" | "success";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("initial");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Hooks
  const { login: googleLogin } = useGoogleLogin();
  const { login: githubLogin } = useGitHubLogin();
  const { register: registerUser, isPending: isRegistering } = useRegister();
  const { resendVerify, isPending: isResending } = useResendVerify();

  // Form setup
  const methods = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
    },
  });

  // Countdown logic for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handlers
  const onRegister = (data: RegisterSchema) => {
    registerUser(data, {
      onSuccess: (response) => {
        setRegisteredEmail(data.email);
        setStep("success");
        setCountdown(60);
        toast.success(
          response.message || "Account created! Please verify your email.",
        );
      },
      onError: (error) => {
        toast.error(error.message || "Registration failed. Please try again.");
      },
    });
  };

  const onResend = () => {
    if (countdown > 0) return;
    resendVerify(
      { email: registeredEmail },
      {
        onSuccess: (response) => {
          setCountdown(60);
          toast.success(response.message || "Verification email sent!");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to resend email.");
        },
      },
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step === "initial" && (
        <div className="space-y-6 fade-in">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Get Started
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Choose your preferred way to register
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <WithMail onClick={() => setStep("form")} />
            <IconButton
              Icon={User}
              text="Login to your account"
              onClick={() => router.push("/auth/login")}
            />

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
          </div>
        </div>
      )}

      {step === "form" && (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onRegister)}>
            <RegisterForm
              isLoading={isRegistering}
              onBack={() => setStep("initial")}
            />
          </form>
        </FormProvider>
      )}

      {step === "success" && (
        <ResendEmail
          email={registeredEmail}
          onResend={onResend}
          isResending={isResending}
          countdown={countdown}
          onBack={() => setStep("initial")}
        />
      )}
    </div>
  );
}
