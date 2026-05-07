"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from "@/schemas/auth.schema";
import { useForgotPassword } from "@/hooks/useAuth";

// Components
import ForgotForm from "@/components/auth/Forgot";
import ForgotResend from "@/components/auth/ForgotResend";

type Step = "form" | "success";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  // Hooks
  const { forgotPassword, isPending } = useForgotPassword();

  // Form setup
  const methods = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
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
  const onSubmit = (data: ForgotPasswordSchema) => {
    forgotPassword(data, {
      onSuccess: (response) => {
        setEmail(data.email);
        setStep("success");
        setCountdown(60);
        toast.success(response.message || "Reset link sent to your email.");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to send reset link.");
      },
    });
  };

  const onResend = () => {
    if (countdown > 0) return;
    onSubmit({ email });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step === "form" && (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <ForgotForm
              isLoading={isPending}
              onBack={() => router.push("/auth/login")}
            />
          </form>
        </FormProvider>
      )}

      {step === "success" && (
        <ForgotResend
          email={email}
          onResend={onResend}
          isResending={isPending}
          countdown={countdown}
          onBack={() => setStep("form")}
        />
      )}
    </div>
  );
}
