"use client";

import React from "react";
import BackButton from "@/common/BackButton";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(1000);

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const maskImage = useMotionTemplate`radial-gradient(350px circle at ${smoothX}px ${smoothY}px, black, transparent)`;

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      {/* --- Left Side: Content --- */}
      <div className="flex flex-col p-6 sm:p-12 relative z-10">
        <div className="w-full">
          <div className="relative group inline-block">
            <div className="relative z-10 transition-transform duration-400 group-hover:-translate-y-1">
              <BackButton />
            </div>
            <div className="hidden lg:block absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-600 rounded-full opacity-0 blur-xl transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-[15] -z-10 pointer-events-none" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>

      {/* --- Right Side --- */}
      <div
        onMouseMove={handleMouseMove}
        className="hidden lg:block relative border-l border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 dark:bg-zinc-950/20 overflow-hidden"
      >
        <svg
          className="absolute inset-0 h-full w-full stroke-zinc-50 dark:stroke-zinc-900/10"
          fill="none"
        >
          <defs>
            <pattern
              id="grid-base"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
              x="-1"
              y="-1"
            >
              <path d="M50 0H0V50" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-base)" />
        </svg>

        <motion.div
          className="absolute inset-0 pointer-events-none opacity-100"
          style={{
            maskImage: maskImage,
            WebkitMaskImage: maskImage,
          }}
        >
          <svg className="h-full w-full stroke-indigo-500" fill="none">
            <defs>
              <pattern
                id="grid-high"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
                x="-1"
                y="-1"
              >
                <path d="M50 0H0V50" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-high)" />
          </svg>
          <div className="absolute inset-0 bg-indigo-500/5" />
        </motion.div>

        {/* Branding Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end bg-linear-to-t from-zinc-50 dark:from-zinc-950/80 via-transparent to-transparent pointer-events-none">
          <h1 className="text-[10vh] lg:text-[20vh] font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-zinc-200/60 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950/20 opacity-75">
            Upnixo.
          </h1>
        </div>
      </div>
    </div>
  );
}
