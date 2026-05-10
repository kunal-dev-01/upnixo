import React, { useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { useUpdateAvatar } from "@/hooks/useUser";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader } from "@/common/Loader";
import { Camera, CircleCheck, Mail, User } from "@/svg/Common";
import { AlertCircle } from "@/svg/Extra";

function UserProfile() {
  const user = useAuthStore((s) => s.user);
  const { updateAvatar, isPending } = useUpdateAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size too large (max 5MB)");
        return;
      }

      updateAvatar(file, {
        onSuccess: () => {
          toast.success("Avatar is being processed...");
        },
        onError: () => {
          toast.error("Failed to upload avatar");
        },
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-8 w-full"
    >
      {/* --- Avatar Section --- */}
      <div className="relative shrink-0">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAvatarClick}
          className={`
            relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden cursor-pointer
            ring-4 ring-white dark:ring-zinc-800 
            ${isPending ? "opacity-50" : "opacity-100"}
          `}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url.startsWith("http") ? user.avatar_url : `https://${user.avatar_url}`}
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <User className="w-14 h-14 text-zinc-400" />
            </div>
          )}

          {/* Hover Overlay */}
          {!isPending && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <div className="p-2 bg-white/20 rounded-full">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          )}

          {/* Loader Overlay */}
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/20 backdrop-blur-sm">
              <Loader className="w-8 h-8 text-indigo-600" />
            </div>
          )}
        </motion.div>

        {/* Floating Upload Icon (Visible on small screens or just as a hint) */}
        <button
          onClick={handleAvatarClick}
          className="absolute bottom-1 right-1 p-2 bg-indigo-600 rounded-full text-white shadow-lg border-2 border-white dark:border-zinc-900 hover:bg-indigo-700 transition-colors"
        >
          <Camera className="w-4 h-4" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* --- Info Section --- */}
      <div className="flex-1 flex flex-col items-center space-y-4">
        <div className="text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {user.full_name}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              <Mail className="w-4.5 h-4.5 text-zinc-500" />
            </div>
            <span className="text-zinc-500 dark:text-zinc-400 font-medium text-sm sm:text-base">
              {user.email}
            </span>
          </div>
        </div>

        {/* Status Badges Row */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          {user.email_verified ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
              <CircleCheck className="w-3.5 h-3.5" />
              Verified
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              Pending
            </div>
          )}

          <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
            Standard Member
          </div>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md text-center leading-relaxed">
          Member since{" "}
          <span className="text-zinc-800 dark:text-zinc-200 font-medium">
            {new Date(user.created_at).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          . Manage your public profile and personal branding settings here.
        </p>
      </div>
    </motion.div>
  );
}

export default UserProfile;
