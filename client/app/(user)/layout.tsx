"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/store/sidebar.store";
import { DesktopSidebar } from "@/components/sidebar/DesktopSidebar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPinned, togglePin } = useSidebarStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const isExpanded = isPinned || isHovered;

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop Sidebar Only */}
      <DesktopSidebar
        isExpanded={isExpanded}
        isPinned={isPinned}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        togglePin={togglePin}
        pathname={pathname}
      />

      <main
        className={`flex-1 transition-all duration-300 ease-in-out p-6 md:p-8 ${
          isPinned ? "ml-56" : "ml-16"
        }`}
      >
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
