"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVerifyEmail } from "@/hooks/useAuth";
import { Loader } from "@/common/Loader";
import { SimpleCheck, Error, ArrowLeft } from "@/svg/Common";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const { verifyEmail, isPending, isSuccess, isError, error } = useVerifyEmail();

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
  };

  return (
    <div className="w-full max-w-md mx-auto text-center py-12">
      <AnimatePresence mode="wait">
        {isPending && (
          <motion.div
            key="loading"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
              <Loader className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Verifying your email</h2>
              <p className="text-zinc-500 dark:text-zinc-400">Please wait while we validate your account.</p>
            </div>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            key="success"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
              <SimpleCheck className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Email Verified!</h2>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed px-6">
                Your account is now fully active. You're all set to start using Upnixo.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="mt-4 flex items-center justify-center w-full py-2 px-6 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-full transition-all duration-300"
            >
              Go to Dashboard
            </Link>
          </motion.div>
        )}

        {(isError || !token) && (
          <motion.div
            key="error"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
              <Error className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Verification Failed</h2>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed px-6">
                {error?.message || "The verification link is invalid or has expired."}
              </p>
            </div>
            <div className="mt-4 w-full space-y-3">
              <Link
                href="/auth/register"
                className="flex items-center justify-center w-full py-2 px-6 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold rounded-full transition-all duration-300"
              >
                Back to Registration
              </Link>
              <button
                onClick={() => router.push("/auth/login")}
                className="group flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Sign In instead
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-zinc-500">Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}