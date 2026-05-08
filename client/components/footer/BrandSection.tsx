"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import React from "react";

export default function BrandingSection({ time }: { time: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-7, 7]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    x.set(mouseXPos / width - 0.5);
    y.set(mouseYPos / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="w-full max-w-7xl px-4 md:px-6 select-none py-20 relative mx-auto overflow-hidden">
      {/* Top Labels */}
      <div className="flex justify-between items-end mb-[-10px] md:mb-[-20px] lg:mb-[-30px] px-2">
        <span className="text-[10px] md:text-xs font-mono text-zinc-500 tracking-widest uppercase">
          Based in Delhi, IN
        </span>
        <span className="text-[10px] md:text-xs font-mono text-zinc-500">
          {time} IST
        </span>
      </div>

      {/* Tilt Parent Div */}
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: 1000 }}
        className="relative flex justify-center items-center lg:pt-20 pt-8 cursor-default group"
      >
        <motion.div
          style={{ rotateX, rotateY }}
          className="relative flex justify-center items-center"
        >
          {/* Main Branding Layer (Foreground) */}
          <div className="relative z-10 flex items-center justify-center lg:pt-10 pt-5 dark:opacity-[0.95]">
            <div className="w-[50px] sm:w-[65px] md:w-[95px] lg:w-[210px] flex items-center transition-transform duration-500 group-hover:scale-105">
              <svg
                viewBox="0 0 629 934"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto"
              >
                <path
                  className="fill-zinc-900 dark:fill-white"
                  d="M0 61.98C0 27.7494 27.7494 0 61.98 0C96.2106 0 123.96 27.7494 123.96 61.98V587.279C123.96 609.37 106.051 627.279 83.9599 627.279H0V61.98Z"
                />
                <path
                  className="fill-zinc-900 dark:fill-white"
                  d="M455.7 86.1816C455.7 38.5848 494.285 0 541.882 0C589.479 0 628.064 38.5848 628.064 86.1816V627.279H545.7C495.995 627.279 455.7 586.985 455.7 537.279V86.1816Z"
                />
                <path
                  className="fill-zinc-900 dark:fill-white"
                  d="M314.032 320.558C487.467 320.558 628.063 457.882 628.063 627.279C628.063 796.676 487.467 934 314.032 934C140.597 934 0.000168907 796.676 0 627.279C0 457.882 140.597 320.558 314.032 320.558ZM314 459C238.889 459 178 533.992 178 626.5C178 719.008 238.889 794 314 794C389.111 794 450 719.008 450 626.5C450 533.992 389.111 459 314 459Z"
                />
              </svg>
            </div>

            <h1 className="text-[75px] sm:text-[120px] md:text-[165px] lg:text-[310px] leading-none font-black tracking-tighter capitalize">
              pnixo
            </h1>
          </div>

          <div className="absolute inset-0 flex justify-center items-center pointer-events-none opacity-[0.04] dark:opacity-[0.06] -z-10 translate-z-[-50px]">
            <div className="w-[50px] sm:w-[85px] md:w-[130px] lg:w-[200px] flex items-center">
              <svg
                viewBox="0 0 629 934"
                fill="none"
                className="w-full h-auto text-zinc-900 dark:text-white"
              >
                <path
                  fill="currentColor"
                  d="M0 61.98C0 27.7494 27.7494 0 61.98 0C96.2106 0 123.96 27.7494 123.96 61.98V587.279C123.96 609.37 106.051 627.279 83.9599 627.279H0V61.98Z"
                />
                <path
                  fill="currentColor"
                  d="M455.7 86.1816C455.7 38.5848 494.285 0 541.882 0C589.479 0 628.064 38.5848 628.064 86.1816V627.279H545.7C495.995 627.279 455.7 586.985 455.7 537.279V86.1816Z"
                />
                <path
                  fill="currentColor"
                  d="M314.032 320.558C487.467 320.558 628.063 457.882 628.063 627.279C628.063 796.676 487.467 934 314.032 934C140.597 934 0.000168907 796.676 0 627.279C0 457.882 140.597 320.558 314.032 320.558ZM314 459C238.889 459 178 533.992 178 626.5C178 719.008 238.889 794 314 794C389.111 794 450 719.008 450 626.5C450 533.992 389.111 459 314 459Z"
                />
              </svg>
            </div>
            <h1 className="text-[80px] sm:text-[120px] md:text-[180px] lg:text-[330px] font-black tracking-tighter capitalize text-zinc-900 dark:text-white">
              pnixo
            </h1>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
