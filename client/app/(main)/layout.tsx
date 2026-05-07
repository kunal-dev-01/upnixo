"use client";
import React from "react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="w-full flex flex-col min-h-screen">
      <header className="w-full sticky top-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-4 w-full flex items-center justify-center">
          <Navbar />
        </div>
      </header>

      <main className="w-full grow">{children}</main>

      <footer className="w-full border-t border-zinc-100 dark:border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <Footer />
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
