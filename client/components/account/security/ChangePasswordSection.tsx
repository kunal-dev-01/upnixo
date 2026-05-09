import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Input from "@/common/Input";
import VariantButton from "@/common/VariantButton";
import { useChangePassword } from "@/hooks/useAuth";
import {
  changePasswordSchema,
  type ChangePasswordSchema,
} from "@/schemas/auth.schema";

export default function ChangePasswordSection() {
  const { changePassword, isPending } = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordSchema) => {
    changePassword(data, {
      onSuccess: () => {
        toast.success("Password changed successfully!");
        reset();
      },
      onError: (err) => toast.error(err.message || "Failed to change password"),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      <Input
        label="Current Password"
        type="password"
        name="current_password"
        placeholder="••••••••"
        register={register}
        error={errors.current_password?.message}
        variant="form"
        rounded="rounded-2xl"
      />
      <Input
        label="New Password"
        type="password"
        name="new_password"
        placeholder="••••••••"
        register={register}
        error={errors.new_password?.message}
        variant="form"
        rounded="rounded-2xl"
      />
      <VariantButton
        label="Update Password"
        variant="save"
        isLoading={isPending}
        type="submit"
      />
    </form>
  );
}
