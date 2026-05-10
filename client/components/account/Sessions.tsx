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

  const getDeviceIcon = (deviceName: string = "", browser: string = "") => {
    const device = deviceName.toLowerCase();
    const browserLower = browser.toLowerCase();

    if (
      device.includes("iphone") ||
      device.includes("ipad") ||
      browserLower.includes("mobile")
    )
      return <Smartphone className="w-5 h-5" />;
    if (device.includes("mac") || device.includes("laptop"))
      return <Laptop className="w-5 h-5" />;
    if (device.includes("windows")) return <Monitor className="w-5 h-5" />;
    if (device.includes("tablet")) return <Tablet className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
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
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession.revokeSessionAsync(sessionId);
      showToast("success", "Session revoked");
      refetch();
    } catch (error) {
      showToast("error", "Failed to revoke");
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

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="mt-4 text-sm text-zinc-500">Syncing active sessions...</p>
      </div>
    );
  }

  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-1">
      {/* Toast - Responsive positioning */}
      {toast && (
        <div className="fixed bottom-6 right-4 left-4 sm:left-auto z-60 animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border ${
              toast.type === "success"
                ? "bg-white dark:bg-zinc-900 border-emerald-500/20 text-emerald-600"
                : "bg-white dark:bg-zinc-900 border-red-500/20 text-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <CircleCheck className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* CURRENT SESSION SECTION */}
      {currentSession && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Shield className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Current Device
            </h3>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5 p-5 transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 shadow-sm border border-emerald-100 dark:border-emerald-500/20 text-emerald-600">
                  {getDeviceIcon(
                    currentSession.device_name,
                    currentSession.browser,
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                      {currentSession.device_name || "Current Device"}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold uppercase tracking-tight">
                      Active
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="opacity-70">
                        {getBrowserIcon(currentSession.browser)}
                      </span>
                      <span>
                        {currentSession.browser} on {currentSession.os}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 leading-none">
                      <MapPin className="w-3.5 h-3.5 opacity-70" />
                      <span>
                        {currentSession.city}, {currentSession.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 leading-none font-mono">
                      <Globe className="w-3.5 h-3.5 opacity-70" />
                      <span>{currentSession.ip_address}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 md:pt-0 border-t md:border-t-0 border-emerald-200/50">
                <VariantButton
                  variant="delete"
                  label="Log out device"
                  isLoading={logout.isPending}
                  onClick={() => setShowConfirmModal("current")}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* OTHER SESSIONS SECTION */}
      {otherSessions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Logout className="w-4 h-4 text-zinc-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Logged in elsewhere ({otherSessions.length})
              </h3>
            </div>
            <button
              onClick={() => setShowConfirmModal("all")}
              className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 transition-colors bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg"
            >
              Log out all others
            </button>
          </div>

          <div className="grid gap-3">
            {otherSessions.map((session) => (
              <div
                key={session.id}
                className="group p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                      {getDeviceIcon(session.device_name, session.browser)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        {session.device_name || "Unknown Device"}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-zinc-500">
                        <div className="flex items-center gap-1.5">
                          <span className="opacity-70">
                            {getBrowserIcon(session.browser)}
                          </span>
                          <span className="truncate">
                            {session.browser} • {session.os}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 opacity-70" />
                          <span>
                            Last seen: {formatDate(session.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 opacity-70" />
                          <span>
                            {session.city}, {session.country}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="opacity-70">IP:</span>
                          <span>{session.ip_address}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:block">
                    <VariantButton
                      variant="delete"
                      label="Revoke"
                      isLoading={revokingId === session.id}
                      onClick={() => handleRevokeSession(session.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confirmation Modal - Mobile Optimized */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowConfirmModal(null)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-950 rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95">
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 rounded-full bg-red-50 dark:bg-red-500/10">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Confirm Logout
                </h3>
                <p className="text-xs text-zinc-500">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
              {showConfirmModal === "current"
                ? "Are you sure you want to log out from this session? You will need to login again."
                : "This will terminate all other active sessions except for this one. Other devices will be logged out immediately."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 order-2 sm:order-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={
                  showConfirmModal === "current"
                    ? () => logout.logoutAsync()
                    : () => handleRevokeAllOthers()
                }
                className="flex-1 order-1 sm:order-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sessions;
