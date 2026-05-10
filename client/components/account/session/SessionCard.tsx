import { motion, AnimatePresence } from "framer-motion";
import { Clock, Globe, Monitor, Smartphone } from "@/svg/Auth";
import { CircleCheck, Shield } from "@/svg/Common";
import { Laptop, MapPin, Tablet, XCircle } from "@/svg/Extra";
import VariantButton from "@/common/VariantButton";
import type { SessionView } from "@/types/auth.types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const diffHours = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60),
  );

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";
  return date.toLocaleDateString();
};

const getBrowserEmoji = (browser: string): string => {
  const b = browser.toLowerCase();
  if (b.includes("chrome")) return "🌐";
  if (b.includes("firefox")) return "🦊";
  if (b.includes("safari")) return "🧭";
  if (b.includes("edge")) return "🔷";
  return "🌍";
};

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const DeviceIcon = ({
  deviceName = "",
  browser = "",
}: {
  deviceName?: string;
  browser?: string;
}) => {
  const device = deviceName.toLowerCase();
  const b = browser.toLowerCase();

  if (
    device.includes("iphone") ||
    device.includes("ipad") ||
    b.includes("mobile")
  )
    return <Smartphone className="w-5 h-5" />;
  if (device.includes("mac") || device.includes("laptop"))
    return <Laptop className="w-5 h-5" />;
  if (device.includes("windows")) return <Monitor className="w-5 h-5" />;
  if (device.includes("tablet")) return <Tablet className="w-5 h-5" />;
  return <Monitor className="w-5 h-5" />;
};

// ─────────────────────────────────────────────────────────────────────────────
// STATUS TOAST
// ─────────────────────────────────────────────────────────────────────────────

interface StatusToastProps {
  type: "success" | "error";
  message: string;
}

export const StatusToast = ({ type, message }: StatusToastProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="fixed bottom-6 right-4 left-4 sm:left-auto z-100"
  >
    <div
      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md ${
        type === "success"
          ? "bg-white/90 dark:bg-zinc-900/90 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          : "bg-white/90 dark:bg-zinc-900/90 border-red-500/20 text-red-600 dark:text-red-400"
      }`}
    >
      {type === "success" ? (
        <CircleCheck className="w-5 h-5 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 shrink-0" />
      )}
      <span className="text-sm font-bold tracking-tight">{message}</span>
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SESSION CARD
// ─────────────────────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: SessionView;
  isCurrent?: boolean;
  onRevoke: () => void;
  isRevoking: boolean;
}

export const SessionCard = ({
  session,
  isCurrent,
  onRevoke,
  isRevoking,
}: SessionCardProps) => (
  <div
    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
      isCurrent
        ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-500/5"
        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    }`}
  >
    <div className="p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Left — icon + info */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${
              isCurrent
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white"
            }`}
          >
            <DeviceIcon
              deviceName={session.device_name}
              browser={session.browser}
            />
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-[15px] font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">
                {session.device_name ||
                  (isCurrent ? "Current Device" : "Unknown Device")}
              </h4>
              {isCurrent && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight border border-emerald-500/20">
                  <Shield className="w-3 h-3" />
                  Active Now
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-2 min-w-0">
                <span className="opacity-80">
                  {getBrowserEmoji(session.browser)}
                </span>
                <span className="truncate">
                  {session.browser} on {session.os}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 opacity-60" />
                <span className="truncate">
                  {session.city}, {session.country}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 opacity-60" />
                <span>
                  {isCurrent ? "Started: " : "Last seen: "}
                  {formatDate(session.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <Globe className="w-3.5 h-3.5 opacity-60" />
                <span>{session.ip_address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — action */}
        <div className="flex sm:block pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/50">
          <VariantButton
            variant="delete"
            label={isCurrent ? "Log out" : "Revoke"}
            isLoading={isRevoking}
            onClick={onRevoke}
          />
        </div>
      </div>
    </div>
  </div>
);
