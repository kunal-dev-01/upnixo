"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, TriangleAlert } from "@/svg/Common";
import Input from "@/common/Input";
import VariantButton from "@/common/VariantButton";
import { disable2FASchema } from "@/schemas/auth.schema";

interface ActionFlowProps {
  title: string;
  description: string;
  buttonLabel: string;
  variant: "default" | "save" | "delete" | "info";
  onSubmit: (code: string) => void;
  isPending: boolean;
  onBack: () => void;
}

export default function ActionFlow({
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
    resolver: zodResolver(disable2FASchema),
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
