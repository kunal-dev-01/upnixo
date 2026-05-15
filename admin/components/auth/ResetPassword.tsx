import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schemas/auth.schema";
import { useAdminResetPassword } from "@/hooks/useAuth";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import PasswordStrength from "@/common/PasswordStrength";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Key } from "@/svg/Auth";
import BackButton from "@/common/BackButton";

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const { mutate: resetPassword, isPending } = useAdminResetPassword();
  const password = watch("password", "");

  const onSubmit = (data: ResetPasswordFormValues) => {
    resetPassword(
      { token, password: data.password },
      {
        onSuccess: () => {
          toast.success(
            "Password reset successful. Please login with your new password.",
          );
          router.replace("/auth/login");
        },
        onError: (err: any) => {
          toast.error(
            err.message || "Failed to reset password. Link might be expired.",
          );
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
          <Key className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Reset Password
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed px-4">
          Enter a strong new password for your administrator account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            name="password"
            placeholder="••••••••"
            register={register}
            error={errors.password?.message}
            disabled={isPending}
          />

          <Input
            label="Confirm New Password"
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            register={register}
            error={errors.confirmPassword?.message}
            disabled={isPending}
          />

          {password && <PasswordStrength password={password} />}
        </div>

        <div className="mt-8">
          <Submit type="submit" loading={isPending}>
            Update Password
          </Submit>
        </div>

        <BackButton
          type="button"
          className="w-full flex items-center justify-center"
          label="Back to login"
          onClick={() => router.push("/auth/login")}
        />
      </form>
    </div>
  );
}
