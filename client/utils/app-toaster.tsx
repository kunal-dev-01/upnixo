"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AppToaster() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Toaster
      theme={(resolvedTheme || theme) as "light" | "dark" | "system"}
      position="top-center"
      toastOptions={{
        className: "font-sans", 
      }}
    />
  );
}