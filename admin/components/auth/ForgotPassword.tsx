import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/schemas/auth.schema";
import { useAdminForgotPassword } from "@/hooks/useAuth";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import { toast } from "sonner";
import { Key } from "@/svg/Auth";

interface Props {
  onSuccess: (email: string) => void;
}

export default function ForgotPasswordForm({ onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate: forgotPassword, isPending } = useAdminForgotPassword();

  const onSubmit = (data: ForgotPasswordFormValues) => {
    forgotPassword(data.email, {
      onSuccess: () => {
        onSuccess(data.email);
      },
      onError: (err: any) => {
        toast.error(err.message || "Something went wrong");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
          <Key className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Forgot Password?
        </h1>
        <p className="text-sm text-zinc-400">
          Enter your admin email and we'll send you a recovery link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Admin Email"
          type="email"
          name="email"
          placeholder="admin@upnixo.com"
          register={register}
          error={errors.email?.message}
          disabled={isPending}
        />

        <div className="mt-8">
          <Submit type="submit" loading={isPending}>
            Send Reset Link
          </Submit>
        </div>
      </form>
    </div>
  );
}
