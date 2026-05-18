"use client";

import { Shader, Blob, CursorRipples } from "shaders/react";

export default function Hero() {
  const desktoplines = ["Your Codebase.Your Data.", "My Accountability."];
  const mobileLines = ["Your Codebase.", "Your Data.", "My Accountability."];
  const subheading =
    "Senior Go engineer delivering high-performance backends, encrypted systems, and milestone-based projects — with zero tracking and full transparency.";

  return (
    <div className="w-full lg:min-h-screen min-h-[70vh] relative overflow-hidden fade-in">
      <Shader id="shader-background" width={512} height={512} shader={{}} />

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
    </div>
  );
}
