import { useUpdatePreferences } from "@/hooks/useUser";
import { useAuthStore } from "@/store/auth.store";
import ThemeSelector from "./ThemeCard";
import { toast } from "sonner";

const defaultThemes = [
  {
    id: "light",
    name: "Light",
    image: "/theme/light.svg",
    overlayColor: "bg-indigo-500/10",
  },
  {
    id: "dark",
    name: "Dark",
    image: "/theme/dark.svg",
    overlayColor: "bg-indigo-400/10",
  },
  {
    id: "system",
    name: "System",
    image: "/theme/system.svg",
    overlayColor: "bg-zinc-500/10",
  },
];

function Preferences() {
  const user = useAuthStore((s) => s.user);
  const { updatePreferences, isPending } = useUpdatePreferences();

  const currentTheme = user?.preferences?.theme || "system";

  const handleThemeSelect = (themeId: string) => {
    if (themeId === currentTheme) return;

    updatePreferences(
      { theme: themeId as "light" | "dark" | "system" },
      {
        onSuccess: () => {
          toast.success(`Theme updated to ${themeId}`);
        },
        onError: () => {
          toast.error("Failed to update theme");
        },
      },
    );
  };

  return (
    <div
      className={`space-y-6 transition-opacity duration-200 ${isPending ? "opacity-50 pointer-events-none" : "opacity-100"}`}
    >
      <ThemeSelector
        themes={defaultThemes}
        selectedTheme={currentTheme}
        onThemeSelect={handleThemeSelect}
      />

      {isPending && (
        <p className="text-xs text-zinc-500 animate-pulse text-center">
          Updating your preferences...
        </p>
      )}
    </div>
  );
}

export default Preferences;
