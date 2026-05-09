import { useState } from "react";
import { toast } from "sonner";
import { Shield, Check } from "@/svg/Common";
import VariantButton from "@/common/VariantButton";
import {
  useSetup2FA,
  useConfirm2FA,
  useDisable2FA,
  useRegenerate2FABackupCodes,
} from "@/hooks/useAuth";
import SetupFlow from "./SetupFlow";
import ActionFlow from "./ActionFlow";

export default function TwoFactorSection({
  isEnabled,
}: {
  isEnabled: boolean;
}) {
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
        isPending={isConfirming}
        onBack={handleBack}
        onConfirm={(code) => {
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
      />
    );
  }

  if (step === "disable" || step === "regenerate") {
    const isDisable = step === "disable";
    return (
      <ActionFlow
        title={isDisable ? "Disable 2FA" : "Regenerate Backup Codes"}
        description={
          isDisable
            ? "Please enter your 6-digit verification code to disable Two-Factor Authentication."
            : "Regenerating backup codes will invalidate your existing codes. Enter your 2FA code to proceed."
        }
        buttonLabel={isDisable ? "Disable 2FA" : "Regenerate Codes"}
        variant={isDisable ? "delete" : "save"}
        isPending={isDisable ? isDisabling : isRegenerating}
        onBack={handleBack}
        onSubmit={(code) => {
          const action = isDisable ? disable2FA : regenerateBackupCodes;
          action(
            { code },
            {
              onSuccess: () => {
                toast.success(
                  isDisable
                    ? "2FA disabled successfully"
                    : "Backup codes regenerated!",
                );
                setStep("idle");
              },
              onError: (err) => toast.error(err.message || "Invalid code"),
            },
          );
        }}
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
