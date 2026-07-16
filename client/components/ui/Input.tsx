"use client";

import React, { useId } from "react";
import { InputProps } from "@/types";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      className = "",
      id,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative group">
          {/* Left icon */}
          {leftIcon && (
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-red-500 pointer-events-none"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            className={[
              "w-full h-10 rounded-xl border text-sm font-medium",
              "bg-white dark:bg-slate-900",
              "text-slate-900 dark:text-slate-100",
              "placeholder:text-slate-400 dark:placeholder:text-slate-600",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              hasError
                ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-red-500/20 focus:border-red-500",
              leftIcon ? "pl-10" : "pl-3.5",
              rightIcon ? "pr-10" : "pr-3.5",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          />

          {/* Right icon */}
          {rightIcon && (
            <span
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-red-500"
              aria-hidden="true"
            >
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
          >
            <span aria-hidden="true">•</span>
            {error}
          </p>
        )}

        {/* Hint */}
        {!error && hint && (
          <p
            id={`${inputId}-hint`}
            className="text-xs text-slate-500 dark:text-slate-500"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
