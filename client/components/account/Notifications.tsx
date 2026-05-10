import { useUpdatePreferences } from "@/hooks/useUser";
import { useAuthStore } from "@/store/auth.store";
import { Switch } from "@/common/SwitchButton";
import { toast } from "sonner";
import { NotificationSettings } from "@/types/user.types";

function Notifications() {
  const user = useAuthStore((s) => s.user);
  const { updatePreferences, isPending } = useUpdatePreferences();

  const settings = user?.preferences?.notifications || {
    email: {
      order_updates: true,
      chat_messages: true,
      billing_invoices: true,
      marketing: false,
    },
    push: { mentions: true, direct_messages: true, security_alerts: true },
  };

  const handleUpdate = (
    category: keyof NotificationSettings,
    field: string,
    value: boolean,
  ) => {
    const updatedSettings = {
      ...settings,
      [category]: {
        //@ts-ignore - dynamic key access
        ...settings[category],
        [field]: value,
      },
    };

    updatePreferences(
      { notifications: updatedSettings },
      {
        onSuccess: () => toast.success("Notification settings updated"),
        onError: () => toast.error("Failed to update settings"),
      },
    );
  };

  const NotificationGroup = ({
    title,
    category,
    field,
    label,
  }: {
    title: string;
    category: keyof NotificationSettings;
    field: string;
    label: string;
  }) => {
    //@ts-ignore
    const isEnabled = settings[category][field];

    return (
      <div className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
        <div className="flex items-center">
          <Switch
            checked={isEnabled === true}
            onChange={(checked) => handleUpdate(category, field, checked)}
            isLoading={isPending}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* EMAIL SETTINGS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
          Email Notifications
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <NotificationGroup
            title="Order Updates"
            label="Get notified about your order status and shipping"
            category="email"
            field="order_updates"
          />
          <NotificationGroup
            title="Billing & Invoices"
            label="Receive invoices and payment confirmations"
            category="email"
            field="billing_invoices"
          />
          <NotificationGroup
            title="Marketing"
            label="Stay updated with new features and offers"
            category="email"
            field="marketing"
          />
        </div>
      </div>

      {/* PUSH SETTINGS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
          Push Notifications
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <NotificationGroup
            title="Direct Messages"
            label="Instant alerts for new chat messages"
            category="push"
            field="direct_messages"
          />
          <NotificationGroup
            title="Security Alerts"
            label="Critical alerts about your account security"
            category="push"
            field="security_alerts"
          />
        </div>
      </div>
    </div>
  );
}

export default Notifications;
