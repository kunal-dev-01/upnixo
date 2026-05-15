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
  const mouseY = useMotionValue(200);

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
        className="hidden lg:block relative border-l border-zinc-900 bg-zinc-950/20 overflow-hidden"
      >
        <svg
          className="absolute inset-0 h-full w-full stroke-zinc-900/10"
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
        <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none">
          <div className="-z-10 flex items-center justify-center opacity-[0.03] pb-4">
            <div className="w-[130px] flex items-cente">
              <svg
                viewBox="0 0 629 934"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto"
              >
                <path
                  className="fill-white"
                  d="M0 61.98C0 27.7494 27.7494 0 61.98 0C96.2106 0 123.96 27.7494 123.96 61.98V587.279C123.96 609.37 106.051 627.279 83.9599 627.279H0V61.98Z"
                />
                <path
                  className="fill-white"
                  d="M455.7 86.1816C455.7 38.5848 494.285 0 541.882 0C589.479 0 628.064 38.5848 628.064 86.1816V627.279H545.7C495.995 627.279 455.7 586.985 455.7 537.279V86.1816Z"
                />
                <path
                  className="fill-white"
                  d="M314.032 320.558C487.467 320.558 628.063 457.882 628.063 627.279C628.063 796.676 487.467 934 314.032 934C140.597 934 0.000168907 796.676 0 627.279C0 457.882 140.597 320.558 314.032 320.558ZM314 459C238.889 459 178 533.992 178 626.5C178 719.008 238.889 794 314 794C389.111 794 450 719.008 450 626.5C450 533.992 389.111 459 314 459Z"
                />
              </svg>
            </div>

            <h1 className="text-[210px] leading-none font-black tracking-tighter capitalize text-white">
              pnixo
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
