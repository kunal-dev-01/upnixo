import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert } from "@/svg/Common";
import Input from "@/common/Input";
import VariantButton from "@/common/VariantButton";
import { disable2FASchema } from "@/schemas/auth.schema";
import BackButton from "@/common/BackButton";

interface ActionFlowProps {
  buttonLabel: string;
  variant: "default" | "save" | "delete" | "info";
  onSubmit: (code: string) => void;
  isPending: boolean;
  onBack: () => void;
}

export default function ActionFlow({
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
      <BackButton
        onClick={onBack}
        label="Back to Security"
        className="w-full flex items-center justify-center"
      />

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
          rounded="rounded-2xl"
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

      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
        <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Make sure you have access to your authenticator app. If you lose
          access, you will need to use your backup codes or contact support.
        </p>
      </div>
    </div>
  );
}
