import React from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader } from "@/common/Loader";

type Props = {
  loading?: boolean;
  children: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Submit({
  loading = false,
  children,
  className = "",
  ...rest
}: Props) {
  return (
    <button
      disabled={loading || rest.disabled}
      {...rest}
      className={`
        outline-none relative overflow-hidden group
        w-full flex items-center justify-center gap-2
        py-2.5 px-6 rounded-full cursor-pointer
        bg-indigo-600 hover:bg-indigo-700 
        text-white font-medium text-sm tracking-wide
        transition-all duration-300 ease-in-out
        disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none
        ${className}
      `}
    >
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2.5">
        {loading && <Loader />}
        <span
          className={
            loading ? "opacity-90" : "opacity-100 text-white font-semibold"
          }
        >
          {children}
        </span>
      </span>

      {/* Enhanced Shine Animation */}
      <div
        className="pointer-events-none absolute top-0 left-[-120%] bottom-0 z-20 
        w-[150%] bg-linear-to-r from-transparent via-white/30 to-transparent 
        skew-x-[-25deg] 
        transition-transform duration-700 ease-out 
        group-hover:translate-x-[150%]"
      />
    </button>
  );
}
