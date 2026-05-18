import { memo } from "react";
import type { User } from "@/types/user.types";
import MenuDropdown, { MenuOption } from "@/common/MenuDropdown";
import { Switch } from "@/common/SwitchButton";
import { toast } from "sonner";
import { AlertCircle, Ban, Calendar, Phone, Unban } from "@/svg/Extra";
import { Copy, Mail, Shield } from "@/svg/Common";
import { Clock } from "@/svg/Auth";
import { getInitials } from "@/utils/Initials";
import { formatDate } from "@/utils/formats";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface ClientCardProps {
  user: User;
  onBlockToggle: (user: User) => void;
  isToggling: boolean;
}

const ClientCard = memo(
  ({ user, onBlockToggle, isToggling }: ClientCardProps) => {
    const handleCopyId = () => {
      navigator.clipboard.writeText(user.id);
      toast.success("User ID copied to clipboard!");
    };

    const menuOptions: MenuOption[] = [
      {
        label: "Copy User ID",
        icon: Copy,
        onClick: handleCopyId,
        variant: "default",
      },
      ...(user.is_blocked
        ? [
            {
              label: "Unblock Access",
              icon: Unban,
              onClick: () => onBlockToggle(user),
              variant: "success" as const,
            },
          ]
        : [
            {
              label: "Suspend/Block",
              icon: Ban,
              onClick: () => onBlockToggle(user),
              variant: "danger" as const,
            },
          ]),
    ];

    return (
      <div
        className={`
        relative overflow-hidden p-6 rounded-3xl transition-all duration-300 border bg-zinc-950 flex flex-col justify-between h-full group shadow-none
        ${
          user.is_blocked
            ? "border-red-500/10"
            : "border-zinc-900 hover:border-zinc-800"
        }
      `}
      >
        {/* Dynamic top gradient decor */}
        <div
          className={`
          absolute top-0 left-0 w-full h-[3px] transition-all duration-300
          ${user.is_blocked ? "bg-red-500" : "bg-zinc-900 group-hover:bg-indigo-500"}
        `}
        />

        <div className="space-y-6">
          {/* Row 1: Profile & Actions */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar Circle */}
              <div className="relative">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-900"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 font-bold text-lg flex items-center justify-center border-2 border-indigo-500/20">
                    {getInitials(user.full_name)}
                  </div>
                )}
                {/* Little Status Indicator Dot */}
                <div
                  className={`
                  absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-950 flex items-center justify-center text-[8px] font-black text-white shadow-none
                  ${user.is_blocked ? "bg-red-500" : user.is_active ? "bg-emerald-500" : "bg-zinc-500"}
                `}
                />
              </div>

              {/* Profile Info */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-extrabold text-white tracking-tight line-clamp-1">
                    {user.full_name}
                  </h4>
                  {/* Status Badges */}
                  {user.is_blocked ? (
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-lg bg-red-500/10 text-red-400 border border-red-500/10">
                      Suspended
                    </span>
                  ) : (
                    <span
                      className={`
                      px-2 py-0.5 text-[10px] font-black uppercase rounded-lg border
                      ${
                        user.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                          : "bg-zinc-900 text-zinc-400 border-zinc-800"
                      }
                    `}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 select-all font-medium">
                  <Mail className="w-4 h-4 text-indigo-500" />
                  <span className="line-clamp-1 break-all hover:text-zinc-350 transition-colors">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Menu dropdown */}
            <MenuDropdown options={menuOptions} />
          </div>

          {/* Row 2: Grid Metadata */}
          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-zinc-900 text-sm">
            {/* Phone */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Phone Number
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <Phone />
                <span className="truncate">{user.phone || "Not set"}</span>
              </div>
            </div>

            {/* 2FA Shield */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Security Verification
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <Shield
                  className={`w-4 h-4 ${user.two_factor_enabled ? "text-emerald-500" : "text-zinc-600"}`}
                />
                <span>
                  {user.two_factor_enabled ? "2FA Active" : "2FA Disabled"}
                </span>
              </div>
            </div>

            {/* Member Since */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Member Since
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <Calendar />
                <span>{formatDate(user.created_at)}</span>
              </div>
            </div>

            {/* Last Login */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                Last Login Audit
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                <Clock className="w-4 h-4" />
                <span>{formatDate(user.last_login_at)}</span>
              </div>
            </div>
          </div>

          {/* Row 3: Block Warning details (if applicable) */}
          {user.is_blocked && (
            <div className="flex gap-2.5 p-3.5 bg-red-500/5 border border-red-500/10 rounded-2xl text-xs font-semibold leading-relaxed text-red-400">
              <AlertCircle className="w-4 h-4" />
              <div className="space-y-1">
                <span className="block font-black uppercase text-[10px] tracking-wider text-red-500">
                  Blocked Reason ({formatDate(user.blocked_at)}):
                </span>
                <p className="italic leading-normal select-all">
                  "{user.blocked_reason || "No specified reason"}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer toggle control row */}
        <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between">
          <div className="space-y-0.5 text-left">
            <span className="text-xs font-bold text-zinc-300 block">
              System Workspace Access
            </span>
            <span className="text-[11px] font-medium text-zinc-500 block">
              {user.is_blocked
                ? "Access suspended instantly"
                : "User currently permitted to login"}
            </span>
          </div>

          {/* Switch toggler */}
          <Switch
            checked={!user.is_blocked}
            onChange={() => onBlockToggle(user)}
            isLoading={isToggling}
          />
        </div>
      </div>
    );
  },
);

ClientCard.displayName = "ClientCard";
export default ClientCard;
