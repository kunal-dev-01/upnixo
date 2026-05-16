"use client";
import React from "react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import Sidebar from "@/components/sidebar/Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="w-full flex flex-col min-h-screen relative">
      <header className="w-full fixed top-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-5 lg:px-0 py-4 w-full flex items-center justify-center">
          <Navbar onOpenSidebar={() => setIsSidebarOpen(true)} />
        </div>
      </header>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="w-full grow">{children}</main>

      <footer className="w-full">
        <Footer />
      </footer>
    </div>
  );
}

export default MainLayout;
