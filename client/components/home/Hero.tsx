"use client";

import React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import VariantButton from "@/common/VariantButton";

export default function Hero() {
  const desktoplines = ["Your Codebase.Your Data.", "My Accountability."];
  const mobileLines = ["Your Codebase.", "Your Data.", "My Accountability."];
  const subheading =
    "Senior Go engineer delivering high-performance backends, encrypted systems, and milestone-based projects — with zero tracking and full transparency.";

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) {
    if (window.innerWidth < 768) return;

    const { left, top } = currentTarget.getBoundingClientRect();

    const gradient = currentTarget.querySelector("#gradient-tracker");
    if (gradient) {
      const { width: gW, height: gH } = gradient.getBoundingClientRect();
      mouseX.set(clientX - left - gW / 2);
      mouseY.set(clientY - top - gH / 2);
    } else {
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="w-full lg:min-h-screen min-h-[70vh] relative overflow-hidden fade-in"
    >
      <div
        id="hover-effect"
        className="absolute inset-0 w-full min-h-screen -z-10 pointer-events-none transition-all duration-500"
      >
        <div className="md:hidden absolute top-[-50px] left-[-50px] w-[400px] h-[300px] rounded-full bg-indigo-600/30 blur-[100px] -z-20" />

        <motion.div
          id="gradient-tracker"
          style={{ x: smoothX, y: smoothY }}
          className="hidden md:block absolute top-0 left-0 w-[300px] h-[300px] rounded-full bg-indigo-600 blur-[50px] -z-20"
        />

        <img
          src="/pattern.svg"
          alt="pattern"
          className="w-full h-full object-cover -z-10"
        />
      </div>

      <div className="w-full lg:min-h-screen min-h-[70vh] flex flex-col items-center justify-center py-20 lg:px-10 px-5 relative z-10">
        <div className="text-center">
          {desktoplines.map((line) => (
            <h1
              key={line}
              className="lg:text-8xl md:text-6xl font-black text-center hidden md:block"
            >
              {line}
            </h1>
          ))}

          {mobileLines.map((line) => (
            <h1
              key={line}
              className="text-4xl sm:text-5xl font-black text-center md:hidden"
            >
              {line}
            </h1>
          ))}
        </div>

        <div className="lg:mt-10 mt-5 lg:max-w-3xl md:max-w-2xl max-w-sm">
          <p className="text-center lg:text-lg md:text-md text-base font-medium">
            {subheading}
          </p>
        </div>

        <div
          id="hero-cta"
          className="lg:mt-10 mt-5 w-full max-w-4xl mx-auto grid lg:grid-cols-2 grid-cols-1 gap-3"
        >
          <div className=""></div>
          <div className=""></div>
        </div>
      </div>

      <div className="md:block lg:block hidden absolute bottom-0 w-full h-40 bg-linear-to-b from-transparent to-white dark:to-black" />
    </div>
  );
}
