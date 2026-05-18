import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { useAdminUsers, useBlockUser, useUnblockUser } from "@/hooks/useUser";
import type { User, UserFilters } from "@/types/user.types";
import ClientCard from "./ClientCard";
import ConfirmModal from "@/common/ConfirmModal";
import Input from "@/common/Input";
import Dropdown from "@/common/Dropdown";
import SubHeading from "@/common/SubHeading";
import { blockUserSchema, BlockUserSchema } from "@/schemas/user.schema";
import { ArrowLeft } from "@/svg/Common";
import { UserPlus } from "@/svg/Auth";
import MonoButton from "@/common/MonoButton";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ClientList() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals Local State
  const [selectedUserForBlock, setSelectedUserForBlock] = useState<User | null>(
    null,
  );
  const [selectedUserForUnblock, setSelectedUserForUnblock] =
    useState<User | null>(null);

  // Map Filter Options for API call
  const apiFilters: UserFilters = {
    is_blocked:
      statusFilter === "blocked"
        ? true
        : statusFilter === "active"
          ? false
          : undefined,
    page: currentPage,
    limit: itemsPerPage,
  };

  // React Query Calls
  const { data, isPending, isError, refetch } = useAdminUsers(apiFilters);
  const { blockUserAsync, isPending: isBlocking } = useBlockUser();
  const { unblockUserAsync, isPending: isUnblocking } = useUnblockUser();

  // Suspension validation form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BlockUserSchema>({
    resolver: zodResolver(blockUserSchema),
    defaultValues: { reason: "" },
  });

  // Handle Switch or Card Block Action Trigger
  const handleBlockToggleTrigger = (user: User) => {
    if (user.is_blocked) {
      setSelectedUserForUnblock(user);
    } else {
      setSelectedUserForBlock(user);
      reset({ reason: "" }); // Reset reason field
    }
  };

  // Execute Block Action
  const onBlockConfirmSubmit = async (formData: BlockUserSchema) => {
    if (!selectedUserForBlock) return;
    try {
      await blockUserAsync({
        id: selectedUserForBlock.id,
        reason: formData.reason,
      });
      toast.success(
        `Account for ${selectedUserForBlock.full_name} suspended successfully.`,
      );
      setSelectedUserForBlock(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to block user. Please try again.");
    }
  };

  // Execute Unblock Action
  const onUnblockConfirmSubmit = async () => {
    if (!selectedUserForUnblock) return;
    try {
      await unblockUserAsync(selectedUserForUnblock.id);
      toast.success(
        `Access restored successfully for ${selectedUserForUnblock.full_name}.`,
      );
      setSelectedUserForUnblock(null);
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to restore access. Please try again.",
      );
    }
  };

  const usersList = data?.users || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Filtering & Control panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-3xl">
        {/* SubHeading */}
        <SubHeading
          title="Client Accounts"
          description="Manage, monitor, and suspend active client access profiles"
          icon={UserPlus}
          iconBgColor="bg-indigo-500/10"
          iconClassName="text-indigo-400"
        />

        {/* Status Dropdown */}
        <div className="w-full sm:w-60">
          <Dropdown
            label=""
            placeholder="Filter by Status"
            value={statusFilter}
            options={[
              { label: "All accounts", value: "all" },
              { label: "Active only", value: "active" },
              { label: "Suspended only", value: "blocked" },
            ]}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1); // Reset to page 1 on filter
            }}
          />
        </div>
      </div>

      {/* Main Grid View */}
      {isPending ? (
        // Premium Loading skeleton grid
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="h-[280px] bg-zinc-900/35 border border-zinc-900 rounded-3xl animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-4 border border-zinc-900 rounded-2xl bg-zinc-950/50 shadow-none">
          <div className="p-4 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-extrabold text-white">
              Communication Disrupted
            </h4>
            <p className="text-sm text-zinc-500 mt-1 max-w-md">
              Failed to query user listing. Please verify server connection and
              refresh.
            </p>
          </div>
          <MonoButton isLoading={isPending} onClick={() => refetch()}>
            Reconnect Server
          </MonoButton>
        </div>
      ) : usersList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-3xl"
        >
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <UserPlus />
          </div>
          <div className="space-y-1.5 px-6">
            <h4 className="text-lg font-extrabold text-white">
              No Client Accounts Found
            </h4>
            <p className="text-sm text-zinc-500 max-w-sm">
              No clients match your filter query. Try resetting filters.
            </p>
          </div>
          {statusFilter !== "all" && (
            <button
              onClick={() => {
                setStatusFilter("all");
              }}
              className="px-6 py-2.5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 text-sm font-bold cursor-pointer transition-all shadow-none"
            >
              Reset Filters
            </button>
          )}
        </motion.div>
      ) : (
        // Client grid layout (2 col on desktop, 1 col on mobile)
        <div className="space-y-6">
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {usersList.map((user) => (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <ClientCard
                    user={user}
                    onBlockToggle={handleBlockToggleTrigger}
                    isToggling={
                      (selectedUserForBlock?.id === user.id && isBlocking) ||
                      (selectedUserForUnblock?.id === user.id && isUnblocking)
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Conditional Pagination Controls */}
          {totalItems > itemsPerPage && (
            <div className="flex items-center justify-between pt-6 border-t border-zinc-900 w-full mt-8">
              <span className="text-xs font-bold text-zinc-550 select-none">
                Showing{" "}
                <strong className="text-zinc-350">
                  {(currentPage - 1) * itemsPerPage + 1}
                </strong>{" "}
                -{" "}
                <strong className="text-zinc-350">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </strong>{" "}
                of <strong className="text-zinc-350">{totalItems}</strong>{" "}
                accounts
              </span>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl border border-zinc-850 bg-zinc-950 text-zinc-450 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900 transition-all cursor-pointer flex items-center justify-center shadow-none"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-zinc-350 select-none px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl border border-zinc-850 bg-zinc-950 text-zinc-450 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-900 transition-all cursor-pointer flex items-center justify-center shadow-none"
                >
                  <ArrowLeft className="rotate-180 w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          SUSPEND/BLOCK DIALOG WITH ZOD REASON FIELD
          ─────────────────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={selectedUserForBlock !== null}
        onClose={() => setSelectedUserForBlock(null)}
        onConfirm={handleSubmit(onBlockConfirmSubmit)}
        title="Suspend Account Access"
        description={`Confirming this will immediately terminate all active login sessions for ${selectedUserForBlock?.full_name} and revoke all account privileges.`}
        confirmLabel="Suspend Access"
        cancelLabel="Keep Permitted"
        isPending={isBlocking}
      >
        <form
          onSubmit={handleSubmit(onBlockConfirmSubmit)}
          className="space-y-4 text-left"
        >
          <Input
            label="Provide a Suspension Reason"
            name="reason"
            placeholder="e.g., Suspicious transaction attempt / policy violation"
            register={register}
            error={errors.reason?.message}
            rounded="rounded-2xl"
          />
        </form>
      </ConfirmModal>

      {/* ───────────────────────────────────────────────────────────────────────
          RESTORE/UNBLOCK ACCESS DIALOG
          ─────────────────────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={selectedUserForUnblock !== null}
        onClose={() => setSelectedUserForUnblock(null)}
        onConfirm={onUnblockConfirmSubmit}
        title="Restore Workspace Access"
        description={`Are you sure you want to restore workspace and security permission for ${selectedUserForUnblock?.full_name}? They will be allowed to log back in immediately.`}
        confirmLabel="Restore Access"
        cancelLabel="Cancel"
        isPending={isUnblocking}
      />
    </div>
  );
}

export default ClientList;
