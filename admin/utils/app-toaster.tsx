"use client";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";

export function AppToaster() {
  const [mounted, setMounted] = useState(false);

  // Prevent Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: "font-sans",
      }}
    />
  );
}
