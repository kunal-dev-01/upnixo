"use client";

import { useState, Suspense } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "@/schemas/auth.schema";
import { useResetPassword } from "@/hooks/useAuth";

// Components
import ResetForm from "@/components/auth/Reset";
import ResetSuccess from "@/components/auth/ResetSuccess";

type Step = "form" | "success";

function ResetPasswordContent() {
  const [step, setStep] = useState<Step>("form");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Hooks
  const { resetPassword, isPending } = useResetPassword();

  // Form setup
  const methods = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      token: token || "",
    },
  });

  // Handlers
  const onSubmit = (data: ResetPasswordSchema) => {
    if (!data.token) {
      toast.error("Reset token is missing. Please check your email link.");
      return;
    }

    resetPassword(data, {
      onSuccess: () => {
        setStep("success");
        toast.success("Password reset successfully!");
      },
      onError: (error) => {
        toast.error(
          error.message || "Failed to reset password. Link may be expired.",
        );
      },
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {step === "form" && (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <ResetForm
              isLoading={isPending}
              onBack={() => router.push("/auth/login")}
            />
          </form>
        </FormProvider>
      )}

      {step === "success" && <ResetSuccess />}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-10 text-zinc-500">Loading...</div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
