import { useState } from "react";
import { toast } from "sonner";
import {
  useAdminSessions,
  useAdminRevokeSession,
  useAdminLogout,
  useAdminLogoutAll,
} from "@/hooks/useAuth";
import { Loader } from "@/common/Loader";
import ConfirmModal from "@/common/ConfirmModal";
import VariantButton from "@/common/VariantButton";
import { Clock, Globe, Logout, Monitor, Smartphone } from "@/svg/Auth";
import { Shield, TriangleAlert } from "@/svg/Common";
import { Laptop, MapPin, Tablet } from "@/svg/Extra";
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
// SESSION CARD
// ─────────────────────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: SessionView;
  isCurrent?: boolean;
  onRevoke: () => void;
  isRevoking: boolean;
}

const SessionCard = ({
  session,
  isCurrent,
  onRevoke,
  isRevoking,
}: SessionCardProps) => (
  <div
    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
      isCurrent
        ? "border-emerald-500/30 bg-emerald-500/5 shadow-lg shadow-emerald-500/5"
        : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700"
    }`}
  >
    <div className="p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Left — icon + info */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 transition-transform ${
              isCurrent
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-zinc-800 text-zinc-500 group-hover:text-white"
            }`}
          >
            <DeviceIcon
              deviceName={session.device_name}
              browser={session.browser}
            />
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-[15px] font-bold text-white truncate max-w-50">
                {session.device_name ||
                  (isCurrent ? "Current Session" : "Unknown Device")}
              </h4>
              {isCurrent && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-tight border border-emerald-500/20">
                  <Shield className="w-3 h-3" />
                  Active Now
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] text-zinc-400">
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
        <div className="flex sm:block pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
          <VariantButton
            variant="delete"
            icon={Logout}
            label={isCurrent ? "Logout" : "Revoke"}
            isLoading={isRevoking}
            onClick={onRevoke}
          />
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Session() {
  const { data: sessions, isLoading, refetch } = useAdminSessions();
  const revokeSession = useAdminRevokeSession();
  const logout = useAdminLogout();
  const logoutAll = useAdminLogoutAll();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<
    "all" | "current" | null
  >(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession.mutateAsync(sessionId);
      toast.success("Session terminated successfully");
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    setShowConfirmModal(null);
    try {
      await logoutAll.mutateAsync();
      toast.success("All sessions terminated. Logging out...");
    } catch {
      toast.error("Failed to clear sessions");
    }
  };

  const handleConfirmAction = () => {
    if (showConfirmModal === "current") {
      logout.mutate();
    } else if (showConfirmModal === "all") {
      handleLogoutAll();
    }
  };

  // ── Modal copy ────────────────────────────────────────────────────────────

  const modalProps =
    showConfirmModal === "current"
      ? {
          title: "End Current Session?",
          description:
            "You will be logged out of this device immediately. Do you want to proceed?",
          confirmLabel: "Yes, Log Out",
        }
      : {
          title: "Terminate ALL Sessions?",
          description:
            "This will end all active sessions including your current one. You will be redirected to the login page.",
          confirmLabel: "Terminate All",
        };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="mt-4 text-sm font-medium text-zinc-500 animate-pulse">
          Loading active sessions...
        </p>
      </div>
    );
  }

  const currentSession = sessions?.find((s) => s.is_current);
  const otherSessions = sessions?.filter((s) => !s.is_current) || [];

  return (
    <div className="space-y-4">
      {/* Security Header */}
      {otherSessions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-zinc-800/50 rounded-xl shrink-0 text-zinc-400">
              <TriangleAlert className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Secure your account
              </h4>
              <p className="text-[13px] text-zinc-400 leading-snug">
                You have {otherSessions.length} other active session
                {otherSessions.length > 1 ? "s" : ""}. Termination will force
                those devices to log in again.
              </p>
            </div>
          </div>

          <VariantButton
            variant="delete"
            className="w-full sm:w-auto"
            onClick={() => setShowConfirmModal("all")}
            isLoading={logoutAll.isPending}
            label="Logout All Devices"
          />
        </div>
      )}

      {/* Session list */}
      <div className="grid gap-3">
        {currentSession && (
          <SessionCard
            session={currentSession}
            isCurrent
            onRevoke={() => setShowConfirmModal("current")}
            isRevoking={logout.isPending}
          />
        )}

        {otherSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onRevoke={() => handleRevokeSession(session.id)}
            isRevoking={revokingId === session.id}
          />
        ))}

        {!sessions ||
          (sessions.length === 0 && (
            <div className="text-center py-12 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
              <p className="text-sm text-zinc-500 font-medium">
                No other active sessions found.
              </p>
            </div>
          ))}
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={!!showConfirmModal}
        onClose={() => setShowConfirmModal(null)}
        onConfirm={handleConfirmAction}
        {...modalProps}
      />
    </div>
  );
}

export default Session;
