"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema,
  verifySchema,
  type LoginFormValues,
  type VerifyFormValues,
} from "@/schemas/auth.schema";
import { useAdminLogin, useAdminVerify } from "@/hooks/useAuth";
import LoginForm from "@/components/auth/Login";
import LoginVerify from "@/components/auth/LoginVerify";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "verify">("login");
  const [adminEmail, setAdminEmail] = useState("");

  // Step 1: Login Credentials
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", master_secret_key: "" },
  });

  // Step 2: Verification Code
  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: "" },
  });

  const { mutate: login, isPending: isLoginPending } = useAdminLogin();
  const { mutate: verify, isPending: isVerifyPending } = useAdminVerify();

  const onLoginSubmit = (data: LoginFormValues) => {
    login(data, {
      onSuccess: () => {
        setAdminEmail(data.email);
        setStep("verify");
        toast.success("Verification code sent to your email");
      },
      onError: (err: any) => {
        toast.error(err.message || "Login failed");
      },
    });
  };

  const onVerifySubmit = (data: VerifyFormValues) => {
    verify(
      { email: adminEmail, code: data.code },
      {
        onSuccess: () => {
          toast.success("Login successful");
        },
        onError: (err: any) => {
          toast.error(err.message || "Verification failed");
        },
      },
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === "login" ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <FormProvider {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <LoginForm isLoading={isLoginPending} />
              </form>
            </FormProvider>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FormProvider {...verifyForm}>
              <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)}>
                <LoginVerify
                  email={adminEmail}
                  isLoading={isVerifyPending}
                  onBack={() => setStep("login")}
                />
              </form>
            </FormProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
