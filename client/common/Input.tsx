import { EyeClose, EyeOpen } from "@/svg/Common";
import { memo, useState } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  register: any;
  error?: string;
  name: string;
}

const Input = memo(
  ({
    label,
    type = "text",
    placeholder,
    register,
    error,
    name,
    disabled,
    ...rest
  }: InputProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={name}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1"
        >
          {label}
        </label>

        <div className="relative group">
          <input
            id={name}
            disabled={disabled}
            type={isPassword ? (showPassword ? "text" : "password") : type}
            placeholder={placeholder}
            {...rest}
            {...register(name)}
            className={`
            w-full px-5 py-2.5 text-sm font-semibold border-2 rounded-full outline-none transition-all duration-300
            ${isPassword ? "pr-12" : ""} 
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 dark:focus:ring-red-500/20"
                : "border-zinc-200 dark:border-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-600 dark:focus:border-indigo-400 focus:ring-4 focus:ring-indigo-600/10 dark:focus:ring-indigo-400/20"
            } 
            text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 
            disabled:cursor-not-allowed disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-500 dark:disabled:text-zinc-600
          `}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              {showPassword ? (
                <EyeOpen className="w-5 h-5" />
              ) : (
                <EyeClose className="w-5.5 h-5.5" />
              )}
            </button>
          )}
        </div>

        {/* Error text */}
        {error && (
          <span className="text-[13px] text-red-500 mt-0.5 ml-1 font-medium">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
