import { useState } from "react";
import {
  useSessions,
  useRevokeSession,
  useRevokeAllOtherSessions,
  useLogout,
} from "@/hooks/useAuth";
import VariantButton from "@/common/VariantButton";
import { Loader } from "@/common/Loader";
import { Clock, Globe, Logout, Monitor, Smartphone } from "@/svg/Auth";
import { CircleCheck, Shield } from "@/svg/Common";
import { AlertCircle, Laptop, MapPin, Tablet, XCircle } from "@/svg/Extra";

function Sessions() {
  const { sessions, isPending, refetch } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeAllOther = useRevokeAllOtherSessions();
  const logout = useLogout();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<
    "all" | "current" | null
  >(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const getDeviceIcon = (deviceName: string, browser: string) => {
    const device = deviceName.toLowerCase();
    const browserLower = browser.toLowerCase();

    if (device.includes("iphone") || device.includes("ipad"))
      return <Smartphone className="w-5 h-5" />;
    if (device.includes("mac")) return <Laptop className="w-5 h-5" />;
    if (device.includes("windows")) return <Monitor className="w-5 h-5" />;
    if (device.includes("tablet")) return <Tablet className="w-5 h-5" />;
    if (browserLower.includes("mobile"))
      return <Smartphone className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  };

  const getBrowserIcon = (browser: string) => {
    const browserLower = browser.toLowerCase();
    if (browserLower.includes("chrome")) return "🌐";
    if (browserLower.includes("firefox")) return "🦊";
    if (browserLower.includes("safari")) return "🧭";
    if (browserLower.includes("edge")) return "🔷";
    return "🌍";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
      showToast("success", "All other sessions revoked successfully");
      refetch();
    } catch (error) {
      showToast("error", "Failed to revoke sessions");
    }
  };

  const handleLogoutCurrent = async () => {
    setShowConfirmModal(null);
    await logout.logoutAsync();
  };

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          Loading your sessions...
        </p>
      </div>
    );
  }

  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg max-w-sm mx-auto sm:mx-0">
          <div
            className={`absolute inset-0 rounded-xl ${
              toast.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30"
                : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30"
            }`}
          />
          <div className="relative flex items-center gap-2">
            {toast.type === "success" ? (
              <CircleCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <span
              className={`text-sm font-medium ${
                toast.type === "success"
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* Current Session */}
      {currentSession && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Current Session
            </h3>
          </div>

          <div className="relative overflow-hidden rounded-xl border-2 border-emerald-200 dark:border-emerald-500/30 bg-linear-to-r from-emerald-50/50 to-transparent dark:from-emerald-500/5 p-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 flex-wrap">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                  {getDeviceIcon(
                    currentSession.device_name,
                    currentSession.browser,
                  )}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {currentSession.device_name || "Unknown Device"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium whitespace-nowrap">
                      Active Now
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      {getBrowserIcon(currentSession.browser)}{" "}
                      {currentSession.browser}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {currentSession.os}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {currentSession.city}, {currentSession.country}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-xs break-all">
                      {currentSession.ip_address}
                    </span>
                  </div>
                </div>
              </div>

              <VariantButton
                variant="delete"
                label="Logout"
                isLoading={logout.isPending}
                onClick={() => setShowConfirmModal("current")}
                className="sm:w-auto px-4 py-2 text-sm whitespace-nowrap"
              />
            </div>
          </div>
        </div>
      )}

      {/* Other Sessions */}
      {otherSessions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Logout className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Other Sessions ({otherSessions.length})
              </h3>
            </div>

            <VariantButton
              variant="delete"
              label="Revoke All"
              isLoading={revokeAllOther.isPending}
              onClick={() => setShowConfirmModal("all")}
              className="px-3 py-1.5 text-xs whitespace-nowrap"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {otherSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0">
                      {getDeviceIcon(session.device_name, session.browser)}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {session.device_name || "Unknown Device"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          {getBrowserIcon(session.browser)} {session.browser}
                        </span>
                        <span>•</span>
                        <span className="truncate">{session.os}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {formatDate(session.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.city}, {session.country}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-xs break-all">
                          {session.ip_address}
                        </span>
                      </div>
                    </div>
                  </div>

                  <VariantButton
                    variant="delete"
                    label="Revoke"
                    isLoading={revokingId === session.id}
                    onClick={() => handleRevokeSession(session.id)}
                    className="sm:w-auto px-4 py-1.5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && !isPending && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
            <Smartphone className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No active sessions found
          </p>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowConfirmModal(null)}
        >
          <div
            className="p-6 max-w-md w-full rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-500/10">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {showConfirmModal === "current"
                  ? "Logout Current Device?"
                  : "Revoke All Sessions?"}
              </h3>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              {showConfirmModal === "current"
                ? "You will be logged out from this device and redirected to login page."
                : "This will log you out from all other devices. You will stay logged in on this device."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  showConfirmModal === "current"
                    ? handleLogoutCurrent
                    : handleRevokeAllOthers
                }
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                {showConfirmModal === "current" ? "Logout" : "Revoke All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sessions;
