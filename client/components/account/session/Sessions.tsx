import { useState } from "react";
import { toast } from "sonner";
import {
  useSessions,
  useRevokeSession,
  useRevokeAllOtherSessions,
  useLogout,
} from "@/hooks/useAuth";
import { Loader } from "@/common/Loader";
import ConfirmModal from "@/common/ConfirmModal";
import { SessionCard } from "./SessionCard";
import { TriangleAlert } from "@/svg/Common";
import MonoButton from "@/common/MonoButton";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function Sessions() {
  const { sessions, isPending, refetch } = useSessions();
  const revokeSession = useRevokeSession();
  const revokeAllOther = useRevokeAllOtherSessions();
  const logout = useLogout();

  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<
    "all" | "current" | null
  >(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await revokeSession.revokeSessionAsync(sessionId);
      toast.success("Session revoked successfully");
      refetch();
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    setShowConfirmModal(null);
    try {
      await revokeAllOther.revokeAllOtherAsync();
      toast.success("Terminated all other active sessions");
      refetch();
    } catch {
      toast.error("Failed to clear other sessions");
    }
  };

  const handleConfirmAction = () => {
    if (showConfirmModal === "current") {
      logout.logoutAsync();
    } else {
      handleRevokeAllOthers();
    }
  };

  // ── Modal copy ────────────────────────────────────────────────────────────

  const modalProps =
    showConfirmModal === "current"
      ? {
          title: "Confirm Revocation",
          description:
            "Are you sure you want to end your current session? You'll be logged out immediately.",
          confirmLabel: "Yes, Log Out",
        }
      : {
          title: "Confirm Revocation",
          description:
            "This will terminate all other active login sessions. Other devices will need to sign in again.",
          confirmLabel: "Yes, Log Out",
        };

  // ── Loading state ─────────────────────────────────────────────────────────

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
          <div className="absolute inset-0 bg-indigo-600/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-medium text-zinc-500 animate-pulse">
          Syncing your active sessions...
        </p>
      </div>
    );
  }

  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions.filter((s) => !s.is_current);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-4 px-1">
      {/* Header */}
      <div className="w-full">
        {otherSessions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl shrink-0 text-zinc-600 dark:text-zinc-400">
                <TriangleAlert className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                  Secure your account
                </h4>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                  Signing out of all other sessions will force them to log in
                  again.
                </p>
              </div>
            </div>

            <MonoButton
              onClick={() => setShowConfirmModal("all")}
              isLoading={revokeAllOther.isPending}
            >
              Revoke All Other
            </MonoButton>
          </div>
        )}
      </div>

      {/* Session list */}
      <div className="grid gap-4">
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

        {sessions.length === 0 && (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500">No active sessions found.</p>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={!!showConfirmModal}
        onClose={() => setShowConfirmModal(null)}
        onConfirm={handleConfirmAction}
        variant="danger"
        isPending={revokeAllOther.isPending}
        {...modalProps}
      />
    </div>
  );
}
