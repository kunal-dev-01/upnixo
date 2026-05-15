// @/common/Switch.tsx
import React from "react";
import { Loader } from "./Loader";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled,
  isLoading = false,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={isDisabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 ${
        checked ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
      } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span className="sr-only">Toggle</span>

      <span
        className={`pointer-events-none flex items-center justify-center h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      >
        {isLoading && <Loader className="w-3 h-3 text-indigo-600" />}
      </span>
    </button>
  );
};
