import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotMasterKeySchema,
  type ForgotMasterKeyFormValues,
} from "@/schemas/auth.schema";
import { useAdminForgotMasterKey } from "@/hooks/useAuth";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import { ShieldAlert } from "@/svg/More";
import { toast } from "sonner";

interface Props {
  onSuccess: (email: string) => void;
}

export default function ForgotKeyForm({ onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotMasterKeyFormValues>({
    resolver: zodResolver(forgotMasterKeySchema),
  });

  const { mutate: forgotKey, isPending } = useAdminForgotMasterKey();

  const onSubmit = (data: ForgotMasterKeyFormValues) => {
    forgotKey(data, {
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
        <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Forgot Master Key?
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed px-4">
          Recovering your Master Key requires verification of both your
          registered email and phone number.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Input
          label="Admin Email"
          type="email"
          name="email"
          placeholder="admin@upnixo.com"
          register={register}
          error={errors.email?.message}
          disabled={isPending}
        />

        <Input
          label="Phone Number"
          type="tel"
          name="phone"
          placeholder="+91 XXXXX XXXXX"
          register={register}
          error={errors.phone?.message}
          disabled={isPending}
        />

        <Submit loading={isPending}>Verify Identity</Submit>
      </form>
    </div>
  );
}
