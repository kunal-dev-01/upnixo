"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Copy, Download, ArrowLeft } from "@/svg/Common";
import Input from "@/common/Input";
import VariantButton from "@/common/VariantButton";
import { confirm2FASchema, type Confirm2FASchema } from "@/schemas/auth.schema";

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

  const downloadBackupCodes = () => {
    const blob = new Blob([data.backup_codes.join("\n")], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-sm font-bold">1. Scan QR Code</h4>
          <div className="p-4 bg-white rounded-2xl border w-fit mx-auto lg:mx-0">
            <QRCodeSVG value={data.qr_code_url} size={192} />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold">Manual Entry</h4>
            <div className="flex items-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-dashed">
              <code className="text-xs font-mono font-bold text-indigo-600 break-all">
                {data.secret}
              </code>
              <button
                onClick={() => copyToClipboard(data.secret)}
                className="p-1.5 hover:bg-zinc-200 rounded-lg"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-sm font-bold">2. Save Backup Codes</h4>
          <div className="grid grid-cols-2 gap-2 p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border">
            {data.backup_codes.map((code, i) => (
              <code key={i} className="text-[10px] font-mono text-zinc-600">
                {code}
              </code>
            ))}
          </div>
          <button
            onClick={downloadBackupCodes}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold bg-zinc-200 rounded-lg"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>

          <form
            onSubmit={handleSubmit((d) => onConfirm(d.code))}
            className="pt-4 border-t space-y-4"
          >
            <h4 className="text-sm font-bold">3. Verify Code</h4>
            <Input
              label="Verification Code"
              placeholder="000000"
              name="code"
              register={register}
              error={errors.code?.message}
              variant="form"
              maxLength={6}
            />
            <VariantButton
              label="Enable 2FA"
              variant="save"
              isLoading={isPending}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
