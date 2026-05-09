import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/auth.store";
import TwoFactorSection from "./TwoFactorSection";
import ChangePasswordSection from "./ChangePasswordSection";

export default function Security() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"2fa" | "password">("2fa");

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl w-full">
        {(["2fa", "password"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              activeTab === tab
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {tab === "2fa" ? "Two-Factor Auth" : "Password"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "2fa" ? (
            <TwoFactorSection isEnabled={!!user?.two_factor_enabled} />
          ) : (
            <ChangePasswordSection />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
