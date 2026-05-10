"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSessions,
  useRevokeSession,
  useRevokeAllOtherSessions,
  useLogout,
} from "@/hooks/useAuth";
import VariantButton from "@/common/VariantButton";
import { Loader } from "@/common/Loader";
import { Clock, Globe, Monitor, Smartphone } from "@/svg/Auth";
import { CircleCheck, Shield } from "@/svg/Common";
import { AlertCircle, Laptop, MapPin, Tablet, XCircle } from "@/svg/Extra";
import type { SessionView } from "@/types/auth.types";

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Toast notification for feedback
 */
const StatusToast = ({ type, message }: { type: "success" | "error"; message: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="fixed bottom-6 right-4 left-4 sm:left-auto z-[100]"
  >
    <div
      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md ${
        type === "success"
          ? "bg-white/90 dark:bg-zinc-900/90 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
          : "bg-white/90 dark:bg-zinc-900/90 border-red-500/20 text-red-600 dark:text-red-400"
      }`}
    >
      {type === "success" ? (
        <CircleCheck className="w-5 h-5 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="text-sm font-bold tracking-tight">{message}</span>
    </div>
  </motion.div>
);

/**
 * Device icon helper
 */
const DeviceIcon = ({ deviceName = "", browser = "" }: { deviceName?: string; browser?: string }) => {
  const device = deviceName.toLowerCase();
  const browserLower = browser.toLowerCase();

  if (device.includes("iphone") || device.includes("ipad") || browserLower.includes("mobile"))
    return <Smartphone className="w-5 h-5" />;
  if (device.includes("mac") || device.includes("laptop"))
    return <Laptop className="w-5 h-5" />;
  if (device.includes("windows")) return <Monitor className="w-5 h-5" />;
  if (device.includes("tablet")) return <Tablet className="w-5 h-5" />;
  return <Monitor className="w-5 h-5" />;
};

/**
 * Browser emoji helper
 */
const getBrowserEmoji = (browser: string) => {
  const b = browser.toLowerCase();
  if (b.includes("chrome")) return "🌐";
  if (b.includes("firefox")) return "🦊";
  if (b.includes("safari")) return "🧭";
  if (b.includes("edge")) return "🔷";
  return "🌍";
};

/**
 * Individual Session Card
 */
const SessionCard = ({
  session,
  isCurrent,
  onRevoke,
  isRevoking,
}: {
  session: SessionView;
  isCurrent?: boolean;
  onRevoke: () => void;
  isRevoking: boolean;
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isCurrent
          ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-500/5 shadow-sm"
          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            {/* Icon Box */}
            <div
              className={`p-3 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105 ${
                isCurrent
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white"
              }`}
            >
              <DeviceIcon deviceName={session.device_name} browser={session.browser} />
            </div>

            {/* Info Section */}
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-[15px] font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">
                  {session.device_name || (isCurrent ? "Current Device" : "Unknown Device")}
                </h4>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight border border-emerald-500/20">
                    <Shield className="w-3 h-3" />
                    Active Now
                  </span>
                )}
              </div>

              {/* Detail Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="opacity-80">{getBrowserEmoji(session.browser)}</span>
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

          {/* Action Button */}
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
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Sessions() {
  const { sessions, isPending, refetch } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeAllOther = useRevokeAllOtherSessions();
  const logout = useLogout();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<"all" | "current" | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession.revokeSessionAsync(sessionId);
      showToast("success", "Session revoked successfully");
      refetch();
    } catch (error) {
      showToast("error", "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    setShowConfirmModal(null);
    try {
      await revokeAllOther.revokeAllOtherAsync();
      showToast("success", "Terminated all other active sessions");
      refetch();
    } catch (error) {
      showToast("error", "Failed to clear other sessions");
    }
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
          <div className="absolute inset-0 bg-indigo-600/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-medium text-zinc-500 animate-pulse">Syncing your active sessions...</p>
      </div>
    );
  }

  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-1">
      <AnimatePresence>
        {toast && <StatusToast type={toast.type} message={toast.message} />}
      </AnimatePresence>

      {/* SESSIONS HEADER / ACTIONS */}
      <div className="flex items-end justify-between px-1">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-zinc-900 dark:text-white">Device Activity</h3>
          <p className="text-xs text-zinc-500 font-medium">Manage and secure your active login sessions.</p>
        </div>
        {otherSessions.length > 0 && (
          <button
            onClick={() => setShowConfirmModal("all")}
            className="text-[11px] font-bold text-red-500 hover:text-red-600 dark:text-red-400/80 transition-all bg-red-500/5 hover:bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/10 active:scale-95"
          >
            Revoke All Other
          </button>
        )}
      </div>

      {/* SESSION LIST */}
      <div className="grid gap-4">
        {/* Current Session always first */}
        {currentSession && (
          <SessionCard
            session={currentSession}
            isCurrent
            onRevoke={() => setShowConfirmModal("current")}
            isRevoking={logout.isPending}
          />
        )}

        {/* Other Sessions directly below */}
        {otherSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onRevoke={() => handleRevokeSession(session.id)}
            isRevoking={revokingId === session.id}
          />
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500">No active sessions found.</p>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(null)}
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-[2.5rem] sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
              
              <div className="flex flex-col items-center text-center space-y-4 mb-8">
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-600">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                    Confirm Revocation
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed px-4">
                    {showConfirmModal === "current"
                      ? "Are you sure you want to end your current session? You'll be logged out immediately."
                      : "This will terminate all other active login sessions. Other devices will need to sign in again."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95"
                >
                  Go Back
                </button>
                <button
                  onClick={
                    showConfirmModal === "current"
                      ? () => logout.logoutAsync()
                      : () => handleRevokeAllOthers()
                  }
                  className="px-6 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-xl shadow-red-600/20 transition-all active:scale-95"
                >
                  Yes, Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
