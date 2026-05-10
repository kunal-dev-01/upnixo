import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy } from "@/svg/Common";
import Input from "@/common/Input";
import VariantButton from "@/common/VariantButton";
import { confirm2FASchema, type Confirm2FASchema } from "@/schemas/auth.schema";
import BackupCodesGrid from "./BackupCodesGrid";
import BackButton from "@/common/BackButton";

interface Props {
  data: { qr_code_url: string; secret: string; backup_codes: string[] };
  onConfirm: (code: string) => void;
  isPending: boolean;
  onBack: () => void;
}

export default function SetupFlow({
  data,
  onConfirm,
  isPending,
  onBack,
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);

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

  return (
    <div className="space-y-8 mx-auto">
      <BackButton
        label={currentStep === 1 ? "Cancel Setup" : "Previous Step"}
        onClick={
          currentStep === 1 ? onBack : () => setCurrentStep((s) => s - 1)
        }
        className="w-full flex items-center justify-center"
      />

      {/* Progress Indicator */}
      <div className="flex items-center justify-between px-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                s === currentStep
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-110"
                  : s < currentStep
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
              }`}
            >
              {s < currentStep ? "✓" : s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-0.5 rounded-full ${
                  s < currentStep
                    ? "bg-emerald-500"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Backup Codes */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
              Save Backup Codes
            </h4>
            <p className="text-sm text-zinc-500 leading-relaxed">
              If you lose access to your authenticator app, these codes will be
              the only way to access your account. Store them securely.
            </p>
          </div>
          <BackupCodesGrid codes={data.backup_codes} />
          <VariantButton
            label="I've Saved the Codes"
            variant="save"
            onClick={() => setCurrentStep(2)}
          />
        </div>
      )}

      {/* Step 2: QR Code */}
      {currentStep === 2 && (
        <div className="space-y-6 duration-500">
          <div className="space-y-2 text-center">
            <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
              Scan QR Code
            </h4>
            <p className="text-sm text-zinc-500">
              Open your authenticator app and scan the code below.
            </p>
          </div>

          <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-6 shadow-sm">
            <div className="p-4 bg-white rounded-3xl border border-zinc-100 shadow-inner">
              <QRCodeSVG value={data.qr_code_url} size={200} />
            </div>

            <div className="w-full pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">
                Manual Entry
              </p>
              <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
                <code className="flex-1 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all text-center">
                  {data.secret}
                </code>
                <button
                  onClick={() => copyToClipboard(data.secret)}
                  type="button"
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <Copy className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>
          </div>

          <VariantButton
            label="Continue"
            variant="save"
            onClick={() => setCurrentStep(3)}
          />
        </div>
      )}

      {/* Step 3: Verify */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
              Verify Code
            </h4>
            <p className="text-sm text-zinc-500">
              Enter the 6-digit code from your authenticator app to complete
              setup.
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
              rounded="rounded-2xl"
              maxLength={6}
            />
            <VariantButton
              label="Enable 2FA"
              variant="save"
              isLoading={isPending}
            />
          </form>
        </div>
      )}
    </div>
  );
}
