import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@/svg/Common";

interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export default function BackButton({
  label = "Back",
  className = "",
  onClick,
  ...props
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`group relative flex w-fit items-center gap-3 px-5 py-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-300 outline-none rounded-full cursor-pointer border border-zinc-200 dark:border-zinc-800 lg:active:scale-95 ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -z-10 rounded-full bg-zinc-100 dark:bg-zinc-900 scale-[0.8] opacity-0 transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100" />

      <ArrowLeft className="h-4 w-4 transition-transform duration-300 ease-out group-hover:-translate-x-1" />

      <span>{label}</span>
    </button>
  );
}
