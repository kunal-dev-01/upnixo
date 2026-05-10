import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  useOAuthCallback,
  useVerify2FA,
  useVerifyBackupCode,
} from "@/hooks/useAuth";
import { verify2FASchema, type Verify2FASchema } from "@/schemas/auth.schema";
import { isTwoFAPending, isAuthSuccess } from "@/types/auth.types";
import VerifyTwoFA from "./VerifyTwoFA";
import { AlertCircle } from "@/svg/Extra";
import { z } from "zod";

const unified2FASchema = z.object({
  code: z.string().optional(),
  backup_code: z.string().optional(),
});

type Unified2FASchema = z.infer<typeof unified2FASchema>;

interface Props {
  provider: "google" | "github";
}

export default function OAuthCallback({ provider }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isTwoFARequired, setIsTwoFARequired] = useState(false);
  const [isBackupMode, setIsBackupMode] = useState(false);

  const {
    handleCallbackAsync,
    isPending: isAuthPending,
    error: authError,
  } = useOAuthCallback();
  const { verify2FAAsync, isPending: isVerifyPending } = useVerify2FA();
  const { verifyBackupCodeAsync, isPending: isBackupPending } =
    useVerifyBackupCode();

  const methods = useForm<Unified2FASchema>({
    resolver: zodResolver(unified2FASchema),
  });

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      toast.error("Invalid authentication response");
      router.replace("/auth/login");
      return;
    }

    const completeAuth = async () => {
      try {
        const response = await handleCallbackAsync({ provider, code, state });

        if (isTwoFAPending(response)) {
          setIsTwoFARequired(true);
          toast.info("Two-factor authentication required");
        } else if (isAuthSuccess(response)) {
          toast.success("Successfully authenticated");
          router.replace("/dashboard");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to authenticate");
      }
    };

    completeAuth();
  }, [provider, searchParams, handleCallbackAsync, router]);

  const onVerify2FA = async (data: Unified2FASchema) => {
    const pendingToken = sessionStorage.getItem("2fa_pending_token");
    if (!pendingToken) {
      toast.error("Session expired, please login again");
      router.replace("/auth/login");
      return;
    }

    try {
      if (isBackupMode) {
        if (!data.backup_code) {
          toast.error("Please enter a backup code");
          return;
        }
        await verifyBackupCodeAsync({
          two_fa_pending_token: pendingToken,
          backup_code: data.backup_code!,
        });
      } else {
        if (!data.code) {
          toast.error("Please enter verification code");
          return;
        }
        await verify2FAAsync({
          two_fa_pending_token: pendingToken,
          code: data.code!,
        });
      }
      toast.success("Login successful");
      router.replace("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    }
  };

  const isLoading = isAuthPending || isVerifyPending || isBackupPending;

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        {!isTwoFARequired ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6"
          >
            {authError ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Authentication Failed
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                    {authError.message ||
                      "Something went wrong during the sign-in process."}
                  </p>
                </div>
                <button
                  onClick={() => router.replace("/auth/login")}
                  className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold text-sm hover:scale-105 transition-transform"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Verifying Account
                  </h3>
                  <p className="text-sm text-zinc-500 animate-pulse">
                    Finalizing your secure sign-in with{" "}
                    {provider === "google" ? "Google" : "GitHub"}...
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="2fa"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onVerify2FA)}>
                <VerifyTwoFA
                  isLoading={isLoading}
                  onBack={() => router.replace("/auth/login")}
                  isBackupMode={isBackupMode}
                  setIsBackupMode={setIsBackupMode}
                />
              </form>
            </FormProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
