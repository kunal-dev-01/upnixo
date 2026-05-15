"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ForgotPasswordForm from "@/components/auth/ForgotPassword";
import ForgotKeyForm from "@/components/auth/ForgotKey";
import ForgotSuccess from "@/components/auth/ForgotSuccess";

type Tab = "password" | "master-key";

export default function ForgotPage() {
  const [activeTab, setActiveTab] = useState<Tab>("password");
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");

  if (!isSuccess) {
    return <ForgotSuccess email={email} type={activeTab} />;
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      {/* Slider / Toggle */}
      <div className="relative p-1 bg-zinc-900/50 border border-zinc-800 rounded-full flex items-center">
        <motion.div
          className="absolute h-[calc(100%-8px)] bg-indigo-600 rounded-full shadow-lg"
          initial={false}
          animate={{
            width: "50%",
            x: activeTab === "password" ? 0 : "100%",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />

        <button
          onClick={() => setActiveTab("password")}
          className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === "password"
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Password
        </button>

        <button
          onClick={() => setActiveTab("master-key")}
          className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeTab === "master-key"
              ? "text-white"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Master Key
        </button>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {activeTab === "password" ? (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ForgotPasswordForm
                onSuccess={(e) => {
                  setEmail(e);
                  setIsSuccess(true);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="master-key"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ForgotKeyForm
                onSuccess={(e) => {
                  setEmail(e);
                  setIsSuccess(true);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
