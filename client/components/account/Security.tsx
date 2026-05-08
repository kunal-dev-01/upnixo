"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import Input from "@/common/Input";
import VariantButton from "@/common/VariantButton";
import { useAuthStore } from "@/store/auth.store";
import {
  useSetup2FA,
  useConfirm2FA,
  useDisable2FA,
  useRegenerate2FABackupCodes,
  useChangePassword,
} from "@/hooks/useAuth";
import {
  changePasswordSchema,
  confirm2FASchema,
  disable2FASchema,
  type ChangePasswordSchema,
  type Confirm2FASchema,
} from "@/schemas/auth.schema";
import {
  Check,
  Copy,
  Download,
  Shield,
  TriangleAlert,
  ArrowLeft,
} from "@/svg/Common";

function Security() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"2fa" | "password">("2fa");

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex mx-auto p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("2fa")}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === "2fa"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Two-Factor Auth
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
            activeTab === "password"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          Password
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "2fa" ? (
          <motion.div
            key="2fa"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TwoFactorSection isEnabled={!!user?.two_factor_enabled} />
          </motion.div>
        ) : (
          <motion.div
            key="password"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ChangePasswordSection />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TWO-FACTOR AUTHENTICATION SECTION
// ─────────────────────────────────────────────────────────────────────────────

function TwoFactorSection({ isEnabled }: { isEnabled: boolean }) {
  const [step, setStep] = useState<"idle" | "setup" | "disable" | "regenerate">(
    "idle",
  );
  const { setup2FA, data: setupData, isPending: isSettingUp } = useSetup2FA();
  const { confirm2FA, isPending: isConfirming } = useConfirm2FA();
  const { disable2FA, isPending: isDisabling } = useDisable2FA();
  const { regenerateBackupCodes, isPending: isRegenerating } =
    useRegenerate2FABackupCodes();

  const handleStartSetup = () => {
    setup2FA(undefined, {
      onSuccess: () => setStep("setup"),
      onError: (err) =>
        toast.error(err.message || "Failed to initialize 2FA setup"),
    });
  };

  const handleBack = () => setStep("idle");

  if (step === "setup" && setupData) {
    return (
      <SetupFlow
        data={setupData.data}
        onConfirm={(code: string) => {
          confirm2FA(
            { code },
            {
              onSuccess: () => {
                toast.success("2FA enabled successfully!");
                setStep("idle");
              },
              onError: (err) =>
                toast.error(err.message || "Invalid verification code"),
            },
          );
        }}
        isPending={isConfirming}
        onBack={handleBack}
      />
    );
  }

  if (step === "disable") {
    return (
      <ActionFlow
        title="Disable 2FA"
        description="Please enter your 6-digit verification code to disable Two-Factor Authentication."
        buttonLabel="Disable 2FA"
        variant="delete"
        onSubmit={(code: string) => {
          disable2FA(
            { code },
            {
              onSuccess: () => {
                toast.success("2FA disabled successfully");
                setStep("idle");
              },
              onError: (err) => toast.error(err.message || "Invalid code"),
            },
          );
        }}
        isPending={isDisabling}
        onBack={handleBack}
      />
    );
  }

  if (step === "regenerate") {
    return (
      <ActionFlow
        title="Regenerate Backup Codes"
        description="Regenerating backup codes will invalidate your existing codes. Enter your 2FA code to proceed."
        buttonLabel="Regenerate Codes"
        variant="save"
        onSubmit={(code: string) => {
          regenerateBackupCodes(
            { code },
            {
              onSuccess: (res) => {
                toast.success("Backup codes regenerated!");
                // Ideally show the new codes here, but for now just success
                setStep("idle");
              },
              onError: (err) => toast.error(err.message || "Invalid code"),
            },
          );
        }}
        isPending={isRegenerating}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
        <div
          className={`p-3 rounded-xl ${isEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500"}`}
        >
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            {isEnabled
              ? "2FA is currently active"
              : "2FA is currently disabled"}
          </h4>
          <p className="text-xs text-zinc-500">
            {isEnabled
              ? "Your account is protected with an additional layer of security."
              : "Enable two-factor authentication to better protect your account."}
          </p>
        </div>
        {isEnabled && (
          <div className="ml-auto">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {!isEnabled ? (
          <VariantButton
            label="Setup 2FA"
            variant="save"
            isLoading={isSettingUp}
            onClick={handleStartSetup}
          />
        ) : (
          <>
            <VariantButton
              label="Regenerate Backup Codes"
              variant="default"
              onClick={() => setStep("regenerate")}
            />
            <VariantButton
              label="Disable 2FA"
              variant="delete"
              onClick={() => setStep("disable")}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP FLOW COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface SetupFlowProps {
  data: {
    qr_code_url: string;
    secret: string;
    backup_codes: string[];
  };
  onConfirm: (code: string) => void;
  isPending: boolean;
  onBack: () => void;
}

function SetupFlow({ data, onConfirm, isPending, onBack }: SetupFlowProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Confirm2FASchema>({
    resolver: zodResolver(confirm2FASchema),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([data.backup_codes.join("\n")], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "upnixo-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Security
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: QR and Instructions */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              1. Scan QR Code
            </h4>
            <p className="text-xs text-zinc-500">
              Open your authenticator app (like Google Authenticator or Authy)
              and scan this QR code.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-zinc-200 dark:border-zinc-800 w-fit mx-auto lg:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.qr_code_url} alt="QR Code" className="w-48 h-48" />
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Manual Entry
            </h4>
            <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
              <code className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all">
                {data.secret}
              </code>
              <button
                onClick={() => copyToClipboard(data.secret)}
                className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors ml-auto"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Backup Codes and Verify */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              2. Save Backup Codes
            </h4>
            <p className="text-xs text-zinc-500">
              If you lose your phone, you can use these codes to log in. Store
              them safely!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {data.backup_codes.map((code: string, i: number) => (
              <code
                key={i}
                className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400"
              >
                {code}
              </code>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={downloadBackupCodes}
              className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Codes
            </button>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                3. Verify Code
              </h4>
              <p className="text-xs text-zinc-500">
                Enter the 6-digit code from your app to complete the setup.
              </p>
            </div>

            <form
              onSubmit={handleSubmit((d) => onConfirm(d.code))}
              className="space-y-4"
            >
              <Input
                label="Verification Code"
                placeholder="000000"
                name="code"
                register={register}
                error={errors.code?.message}
                variant="form"
                maxLength={6}
              />

              <div className="w-full">
                <VariantButton
                  label="Enable 2FA"
                  variant="save"
                  isLoading={isPending}
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION FLOW COMPONENT (Disable/Regenerate)
// ─────────────────────────────────────────────────────────────────────────────

interface ActionFlowProps {
  title: string;
  description: string;
  buttonLabel: string;
  variant: "default" | "save" | "delete" | "info";
  onSubmit: (code: string) => void;
  isPending: boolean;
  onBack: () => void;
}

function ActionFlow({
  title,
  description,
  buttonLabel,
  variant,
  onSubmit,
  isPending,
  onBack,
}: ActionFlowProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ code: string }>({
    resolver: zodResolver(disable2FASchema), // works for both since they just need code
  });

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Security
      </button>

      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            {title}
          </h4>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>

        <form
          onSubmit={handleSubmit((d) => onSubmit(d.code))}
          className="space-y-4"
        >
          <Input
            label="2FA Verification Code"
            placeholder="000000"
            name="code"
            register={register}
            error={errors.code?.message as string}
            variant="form"
            maxLength={6}
          />

          <div className="w-full">
            <VariantButton
              label={buttonLabel}
              variant={variant}
              isLoading={isPending}
            />
          </div>
        </form>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] leading-relaxed">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Make sure you have access to your authenticator app. If you lose
            access, you will need to use your backup codes or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD SECTION
// ─────────────────────────────────────────────────────────────────────────────

function ChangePasswordSection() {
  const { changePassword, isPending } = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordSchema) => {
    changePassword(data, {
      onSuccess: () => {
        toast.success("Password changed successfully!");
        reset();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to change password");
      },
    });
  };

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Current Password"
          type="password"
          placeholder="••••••••"
          name="current_password"
          register={register}
          error={errors.current_password?.message}
          variant="form"
          rounded="rounded-2xl"
        />

        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          name="new_password"
          register={register}
          error={errors.new_password?.message}
          variant="form"
          rounded="rounded-2xl"
        />

        <div className="w-full pt-2">
          <VariantButton
            label="Update Password"
            variant="save"
            isLoading={isPending}
            type="submit"
          />
        </div>
      </form>
    </div>
  );
}

export default Security;
