import { EyeClose, EyeOpen, TriangleAlert } from '@/svg/Common';
import React, { useState, forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'auth';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, type = 'text', variant = 'default', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    // Determine the actual input type for password toggle
    const inputType = type === 'password' && showPassword ? 'text' : type;

    // Base styles for all inputs
    const baseInputStyles = "w-full transition-all duration-200 outline-none placeholder:text-gray-400";
    
    // Variant specific styling
    const variants = {
      default: "rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
      auth: "rounded-lg border-2 border-gray-100 bg-gray-50 px-4 py-3 text-base focus:border-gray-900 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
    };

    // Error styling
    const errorStyles = error 
      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10" 
      : "";

    return (
      <div className={`w-full flex flex-col gap-1.5 ${className}`}>
        {/* Label */}
        {label && (
          <label 
            className={`font-medium ${variant === 'auth' ? 'text-gray-900 text-sm' : 'text-gray-700 text-sm'}`}
            htmlFor={props.id}
          >
            {label}
          </label>
        )}

        {/* Input Wrapper (Relative for absolute positioning of icons) */}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={`
              ${baseInputStyles}
              ${variants[variant]}
              ${errorStyles}
              ${type === 'password' ? 'pr-10' : ''} 
            `}
            {...props}
          />

          {/* Password Eye Toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 focus:outline-none transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeClose className="h-5 w-5" aria-hidden="true" />
              ) : (
                <EyeOpen className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-500 mt-0.5 animate-in fade-in slide-in-from-top-1">
            <TriangleAlert className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;