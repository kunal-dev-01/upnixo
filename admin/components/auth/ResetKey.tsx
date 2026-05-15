import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetMasterKeySchema,
  type ResetMasterKeyFormValues,
} from "@/schemas/auth.schema";
import { useAdminResetMasterKey } from "@/hooks/useAuth";
import Input from "@/common/Input";
import Submit from "@/common/SubmitButton";
import { ShieldCheck } from "@/svg/More";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import BackButton from "@/common/BackButton";

interface Props {
  token: string;
}

export default function ResetKeyForm({ token }: Props) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetMasterKeyFormValues>({
    resolver: zodResolver(resetMasterKeySchema),
  });

  const { mutate: resetKey, isPending } = useAdminResetMasterKey();

  const onSubmit = (data: ResetMasterKeyFormValues) => {
    resetKey(
      { token, master_key: data.master_key },
      {
        onSuccess: () => {
          toast.success(
            "Master Key updated successfully. You can now login with your new key.",
          );
          router.replace("/auth/login");
        },
        onError: (err: any) => {
          toast.error(
            err.message || "Failed to reset Master Key. Link might be expired.",
          );
        },
      },
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Update Master Key
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed px-4">
          Set a new Master Secret Key. Remember to keep this key safe as it is
          required for every login.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="New Master Secret Key"
          type="password"
          name="master_key"
          placeholder="Enter your new secondary secret"
          register={register}
          error={errors.master_key?.message}
          disabled={isPending}
        />

        <div className="mt-8">
          <Submit type="submit" loading={isPending}>
            Update Master Key
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
