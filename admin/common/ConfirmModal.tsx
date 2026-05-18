"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Calendar } from "@/svg/Extra";
import VariantButton from "./VariantButton";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CircleCheck } from "@/svg/Common";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "success" | "danger"; // Variant add kiya
  children?: React.ReactNode;
  isPending?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Go Back",
  variant = "danger", // Default value inject ki
  children,
  isPending = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Variant Configuration - Exclusive Pure Dark Theme Optimized
  const variantConfig = {
    danger: {
      borderLine:
        "bg-linear-to-r from-transparent via-red-500/50 to-transparent",
      iconBg: "bg-red-500/10 text-red-400",
      icon: <AlertCircle className="w-8 h-8" />,
      btnVariant: "delete" as const,
    },
    success: {
      borderLine:
        "bg-linear-to-r from-transparent via-emerald-500/50 to-transparent",
      iconBg: "bg-emerald-500/10 text-emerald-400",
      icon: <CircleCheck className="w-8 h-8" />,
      btnVariant: "save" as const,
    },
    default: {
      borderLine:
        "bg-linear-to-r from-transparent via-indigo-500/50 to-transparent",
      iconBg: "bg-indigo-500/10 text-indigo-400",
      icon: <Calendar className="w-8 h-8" />, // Aap apna koi bhi default icon swap kar sakte hain
      btnVariant: "save" as const,
    },
  };

  const config = variantConfig[variant] || variantConfig.default;
  const maxWidthClass = children ? "max-w-lg" : "max-w-md";

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-zinc-950/80 cursor-pointer"
            onClick={isPending ? undefined : onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative z-10 w-full ${maxWidthClass} bg-zinc-950 rounded-3xl border border-zinc-900 p-8 shadow-none overflow-hidden transform-gpu will-change-transform max-h-[90vh] overflow-y-auto`}
          >
            {/* Top Border Glow Accent */}
            <div
              className={`absolute top-0 left-0 w-full h-1 ${config.borderLine}`}
            />

            {/* Header Content */}
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className={`p-4 rounded-2xl ${config.iconBg}`}>
                {config.icon}
              </div>
              <div className="space-y-2 w-full">
                <h3 className="text-2xl font-black text-white tracking-tight">
                  {title}
                </h3>
                {description && !children && (
                  <p className="text-sm text-zinc-400 leading-relaxed px-4">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Custom children e.g. input fields */}
            {children && <div className="w-full mb-6">{children}</div>}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <VariantButton
                variant="default"
                label={cancelLabel}
                onClick={onClose}
                disabled={isPending}
              />
              <VariantButton
                variant={config.btnVariant}
                label={confirmLabel}
                onClick={onConfirm}
                isLoading={isPending}
                disabled={isPending}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;

  return createPortal(modalContent, document.body);
}
