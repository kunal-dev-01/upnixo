"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { registerSchema, type RegisterSchema } from "@/schemas/auth.schema";
import {
  useRegister,
  useResendVerify,
  useGoogleLogin,
  useGitHubLogin,
} from "@/hooks/useAuth";
import WithMail from "@/common/WithMail";
import GoogleButton from "@/common/GoogleButton";
import GithubButton from "@/common/GithubButton";
import Input from "@/common/Input";
import { Mail, Refresh } from "@/svg/Common";

type Step = "initial" | "form" | "success";

function Register() {
  const [step, setStep] = useState<Step>("initial");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  const { login: googleLogin } = useGoogleLogin();
  const { login: githubLogin } = useGitHubLogin();
  const { mutate: register, isPending: isRegistering } = useRegister();
  const { mutate: resendVerify, isPending: isResending } = useResendVerify();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onRegister = (data: RegisterSchema) => {
    register(data, {
      onSuccess: () => {
        setRegisteredEmail(data.email);
        setStep("success");
        setCountdown(60);
        toast.success("Registration successful! Please check your email.");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Registration failed");
      },
    });
  };

  const onResend = () => {
    if (countdown > 0) return;
    resendVerify(
      { email: registeredEmail },
      {
        onSuccess: () => {
          setCountdown(60);
          toast.success("Verification email resent!");
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || "Failed to resend email",
          );
        },
      },
    );
  };

  return (
    <div className="w-full">
      {step === "initial" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <WithMail onClick={() => setStep("form")} />
          <div className="relative flex items-center py-2 px-3">
            <div className="grow border-t border-zinc-200 dark:border-zinc-800"></div>
            <span className="shrink mx-4 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Or
            </span>
            <div className="grow border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>
          <GoogleButton onClick={() => googleLogin()} />
          <GithubButton onClick={() => githubLogin()} />
        </div>
      )}

      {step === "form" && (
        <form
          onSubmit={handleSubmit(onRegister)}
          className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500"
        >
          <Input
            label="Full Name"
            type="name"
            name="full_name"
            placeholder="John Doe"
            register={register}
            error={errors.full_name?.message}
          />
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="john@example.com"
            register={register}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            name="password"
            register={register}
            error={errors.password?.message}
          />

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isRegistering ? "Creating account..." : "Create Account"}
          </button>

          <button
            type="button"
            onClick={() => setStep("initial")}
            className="w-full text-center text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            Back to options
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Verify your email
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              We've sent a verification link to <br />
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                {registeredEmail}
              </span>
            </p>
          </div>

          <div className="pt-4 space-y-4">
            <button
              onClick={onResend}
              disabled={countdown > 0 || isResending}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <Refresh
                className={`w-4 h-4 ${isResending ? "animate-spin" : ""}`}
              />
              {countdown > 0 ? `Resend email in ${countdown}s` : "Resend email"}
            </button>

            <button
              onClick={() => setStep("initial")}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Back to Register
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
