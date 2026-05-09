"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy, ArrowLeft } from "@/svg/Common";
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
    <div className="space-y-8 max-w-xl mx-auto pb-8">
      <BackButton
        label="Back to security"
        onClick={onBack}
        className="w-full flex items-center justify-center"
      />

      {/* Step 1: QR Code */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
            1
          </span>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            Scan QR Code
          </h4>
        </div>
        <div className="p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-6 shadow-sm">
          <div className="p-4 bg-white rounded-3xl border border-zinc-100 shadow-inner">
            <QRCodeSVG value={data.qr_code_url} size={200} />
          </div>
          <p className="text-xs text-center text-zinc-500 max-w-[280px] leading-relaxed">
            Scan this QR code with your authenticator app (Google Authenticator,
            Authy, etc.)
          </p>

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
      </div>

      {/* Step 2: Backup Codes */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
            2
          </span>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            Save Backup Codes
          </h4>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          If you lose access to your authenticator app, these codes will be the
          only way to access your account.
        </p>
        <BackupCodesGrid codes={data.backup_codes} />
      </div>

      {/* Step 3: Verify */}
      <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-[10px] font-bold">
            3
          </span>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            Verify Code
          </h4>
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
            className="w-full h-12 rounded-2xl"
          />
        </form>
      </div>
    </div>
  );
}
