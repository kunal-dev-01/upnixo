import { ButtonHTMLAttributes } from "react";
import { Loader } from "@/common/Loader"; // Tumhara custom loader import kiya hai

interface MonoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export default function MonoButton({
  children,
  isLoading = false,
  disabled = false,
  className = "",
  ...props
}: MonoButtonProps) {
  return (
    <button
      disabled={isLoading || disabled}
      className={`
        flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 
        text-[13px] font-bold transition-all rounded-xl shrink-0 
        bg-zinc-900 text-white hover:bg-zinc-800 
        dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 
        disabled:opacity-70 disabled:cursor-not-allowed 
        ${!isLoading && !disabled ? "active:scale-95" : "active:scale-100"} 
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <Loader className="w-5 h-5 text-white dark:text-zinc-900" />
      )}

      {children}
    </button>
  );
}
