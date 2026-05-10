import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "@/store/auth.store";
import { useUpdateProfile, useUpdatePreferences } from "@/hooks/useUser";
import Input from "@/common/Input";
import Dropdown from "@/common/Dropdown";
import VariantButton from "@/common/VariantButton";
import { toast } from "sonner";
import { Save } from "@/svg/More";

interface UserDetailsForm {
  full_name: string;
  timezone: string;
  locale: string;
  default_currency: string;
  language: string;
}

const currencyOptions = [
  { label: "USD ($)", value: "USD" },
  { label: "EUR (€)", value: "EUR" },
  { label: "INR (₹)", value: "INR" },
  { label: "GBP (£)", value: "GBP" },
];

const languageOptions = [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
];

const timezoneOptions = [
  { label: "(GMT+05:30) India Standard Time", value: "Asia/Kolkata" },
  { label: "(GMT+00:00) UTC", value: "UTC" },
  { label: "(GMT-05:00) Eastern Standard Time", value: "America/New_York" },
  { label: "(GMT+08:00) China Standard Time", value: "Asia/Shanghai" },
];

function UserDetails() {
  const user = useAuthStore((s) => s.user);
  const { updateProfile, isPending: profilePending } = useUpdateProfile();
  const { updatePreferences, isPending: prefsPending } = useUpdatePreferences();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserDetailsForm>({
    defaultValues: {
      full_name: user?.full_name || "",
      timezone: user?.timezone || "UTC",
      locale: user?.locale || "en-US",
      default_currency: user?.preferences?.default_currency || "USD",
      language: user?.preferences?.language || "en",
    },
  });

  // Sync form when user data changes (e.g. after a fetch)
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name,
        timezone: user.timezone,
        locale: user.locale,
        default_currency: user.preferences?.default_currency,
        language: user.preferences?.language,
      });
    }
  }, [user, reset]);

  const onSubmit = (data: UserDetailsForm) => {
    // 1. Update Profile (Name, Timezone, Locale)
    updateProfile(
      {
        full_name: data.full_name,
        timezone: data.timezone,
        locale: data.locale,
      },
      {
        onSuccess: () => {
          // 2. Update Preferences (Currency, Language)
          updatePreferences(
            {
              default_currency: data.default_currency,
              language: data.language,
            },
            {
              onSuccess: () => toast.success("Details updated successfully"),
              onError: () => toast.error("Failed to update preferences"),
            },
          );
        },
        onError: () => toast.error("Failed to update profile"),
      },
    );
  };

  const isLoading = profilePending || prefsPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Full Name */}
        <Input
          label="Full Name"
          name="full_name"
          placeholder="Enter your full name"
          register={register}
          error={errors.full_name?.message}
          variant="form"
          rounded="rounded-2xl"
        />

        {/* Timezone */}
        <Dropdown
          label="Timezone"
          options={timezoneOptions}
          value={watch("timezone")}
          onChange={(val) => setValue("timezone", val)}
          disabled={isLoading}
        />

        {/* Locale */}
        <Dropdown
          label="Locale (Region)"
          options={[
            { label: "United States (en-US)", value: "en-US" },
            { label: "India (en-IN)", value: "en-IN" },
            { label: "United Kingdom (en-GB)", value: "en-GB" },
          ]}
          value={watch("locale")}
          onChange={(val) => setValue("locale", val)}
          disabled={isLoading}
        />

        {/* Default Currency */}
        <Dropdown
          label="Default Currency"
          options={currencyOptions}
          value={watch("default_currency")}
          onChange={(val) => setValue("default_currency", val)}
          disabled={isLoading}
        />

        {/* Language */}
        <Dropdown
          label="Interface Language"
          options={languageOptions}
          value={watch("language")}
          onChange={(val) => setValue("language", val)}
          disabled={isLoading}
        />
      </div>

      <div className="pt-2">
        <VariantButton
          label="Save Changes"
          variant="save"
          type="submit"
          isLoading={isLoading}
          icon={Save}
        />
      </div>
    </form>
  );
}

export default UserDetails;
