"use client";

import React, { useId } from "react";
import { FiChevronDown } from "react-icons/fi";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  options: (string | SelectOption)[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      options,
      placeholder = "Select an option",
      className = "",
      id,
      disabled,
      value,
      onChange,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        {/* Select wrapper */}
        <div className="relative group">
          {/* Left icon */}
          {leftIcon && (
            <span
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-red-500 pointer-events-none z-10"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <select
            ref={ref}
            id={selectId}
            value={value}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined
            }
            className={[
              "w-full h-10 rounded-xl border text-sm font-medium",
              "bg-white dark:bg-slate-900",
              "text-slate-900 dark:text-slate-100",
              "transition-all duration-200 cursor-pointer appearance-none",
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800" : "",
              hasError
                ? "border-red-400 focus:ring-red-500/30 focus:border-red-500"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-red-500/20 focus:border-red-500",
              leftIcon ? "pl-10" : "pl-3.5",
              "pr-10",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled className="text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900">
                {placeholder}
              </option>
            )}
            {options.map((opt) => {
              const optValue = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              return (
                <option
                  key={optValue}
                  value={optValue}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1"
                >
                  {optLabel}
                </option>
              );
            })}
          </select>

          {/* Right Chevron Down icon */}
          <span
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none transition-colors group-focus-within:text-red-500"
            aria-hidden="true"
          >
            <FiChevronDown size={16} />
          </span>
        </div>

        {/* Error */}
        {error && (
          <p
            id={`${selectId}-error`}
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
            id={`${selectId}-hint`}
            className="text-xs text-slate-500 dark:text-slate-500"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
