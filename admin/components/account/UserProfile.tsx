import { useAuthStore } from "@/store/auth.store";
import { Mail, User } from "@/svg/Common";
import { getInitials } from "@/utils/Initials";

function UserProfile() {
  const admin = useAuthStore((state) => state.admin);

  if (!admin) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center text-center gap-4 py-4">
        <div className="w-32 h-32 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 transition-transform duration-500 hover:scale-105">
          <span className="text-5xl font-black tracking-tighter">
            {getInitials(admin.full_name)}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <h3 className="text-2xl font-black text-zinc-100 tracking-tight">
            {admin.full_name}
          </h3>

          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
              admin.is_active
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"}`}
            />
            {admin.is_active ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 gap-3">
        {/* Email */}
        <div className="group flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 transition-colors hover:bg-zinc-900/60">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-sm group-hover:border-indigo-500/30 transition-colors">
            <Mail className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
              Email Address
            </span>
            <span className="text-sm font-semibold text-zinc-200 truncate">
              {admin.email}
            </span>
          </div>
        </div>

        {/* Phone */}
        <div className="group flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 transition-colors hover:bg-zinc-900/60">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-sm group-hover:border-indigo-500/30 transition-colors">
            <User className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
              Phone Number
            </span>
            <span className="text-sm font-semibold text-zinc-200">
              {admin.phone || "Not provided"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
