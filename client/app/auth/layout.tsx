"use client";

import React from "react";
import BackButton from "@/common/BackButton"; 

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col p-6 sm:p-12">
        <div className="w-full">
          <BackButton />
        </div>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-center items-center">
        {/* Right side content */}
      </div>
    </div>
  );
}