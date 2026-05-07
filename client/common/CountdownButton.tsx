import React from "react";
import type { ButtonHTMLAttributes } from "react";

interface CountdownButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  countdown?: number;
  defaultText?: string;
  countdownText?: (seconds: number) => string;
  icon?: React.ReactNode;
}

export default function CountdownButton({
  isLoading = false,
  countdown = 0,
  defaultText = "Resend verification link",
  countdownText = (sec) => `Resend link in ${sec}s`,
  icon,
  className = "",
  ...rest
}: CountdownButtonProps) {
  const isDisabled = countdown > 0 || isLoading || rest.disabled;

  return (
    <button
      disabled={isDisabled}
      {...rest}
      className={`
        flex items-center justify-center gap-2.5 w-full py-2 px-6 
        bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 
        text-white dark:text-zinc-900 font-semibold rounded-full 
        transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed 
        ${className}
      `}
    >
      {/* Icon with spin animation if loading */}
      {icon && (
        <span
          className={`flex items-center justify-center ${isLoading ? "animate-spin" : ""}`}
        >
          {icon}
        </span>
      )}

      {/* Text Logic */}
      <span>{countdown > 0 ? countdownText(countdown) : defaultText}</span>
    </button>
  );
}
