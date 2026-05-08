"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/store/sidebar.store";
import { DesktopSidebar } from "@/components/sidebar/DesktopSidebar";
import {
  MobileSidebar,
  MobileHeader,
} from "@/components/sidebar/MobileSidebar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isPinned, togglePin } = useSidebarStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const isExpanded = isPinned || isHovered;

  return (
    <div className="min-h-screen w-full">
      <MobileHeader onOpenMenu={() => setIsMobileMenuOpen(true)} />
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        pathname={pathname}
      />
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
          isPinned ? "md:ml-56" : "md:ml-16"
        } ml-0`}
      >
        <div className="max-w-6xl mr-auto ml-0 lg:mx-auto pt-20 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
