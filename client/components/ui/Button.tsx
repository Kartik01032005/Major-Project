"use client";

import React from "react";
import Link from "next/link";
import { ButtonProps } from "@/types";

/* ─── Variant Styles ─────────────────────────────────────────────────────── */
const variantClasses: Record<string, string> = {
  primary: [
    "bg-red-600 text-white",
    "hover:bg-red-700",
    "active:bg-red-800 active:scale-[0.98]",
    "shadow-[0_4px_14px_0_rgb(220_38_38_/_0.3)]",
    "hover:shadow-[0_6px_20px_0_rgb(220_38_38_/_0.4)]",
    "border border-red-600/20",
  ].join(" "),

  secondary: [
    "bg-white text-slate-800",
    "hover:bg-slate-50",
    "active:bg-slate-100 active:scale-[0.98]",
    "shadow-sm hover:shadow-md",
    "border border-slate-200",
    "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
    "dark:hover:bg-slate-800",
  ].join(" "),

  outline: [
    "bg-transparent text-red-600",
    "border-2 border-red-600/40",
    "hover:border-red-600 hover:bg-red-50",
    "active:bg-red-100 active:scale-[0.98]",
    "dark:hover:bg-red-950/30",
  ].join(" "),

  ghost: [
    "bg-transparent text-slate-600",
    "hover:bg-slate-100 hover:text-slate-900",
    "active:bg-slate-200 active:scale-[0.98]",
    "border border-transparent",
    "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
  ].join(" "),
};

/* ─── Size Styles ────────────────────────────────────────────────────────── */
const sizeClasses: Record<string, string> = {
  sm: "h-8  px-4  text-sm   gap-1.5 rounded-xl",
  md: "h-10 px-5  text-sm   gap-2   rounded-xl",
  lg: "h-12 px-7  text-base gap-2.5 rounded-xl",
};

/* ─── Spinner ────────────────────────────────────────────────────────────── */
const Spinner = () => (
  <svg
    className="animate-spin h-3.5 w-3.5 shrink-0"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/* ─── Button Component ───────────────────────────────────────────────────── */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      href,
      loading = false,
      disabled = false,
      icon,
      iconPosition = "left",
      fullWidth = false,
      children,
      className = "",
      ...rest
    },
    ref
  ) => {
    const base = [
      "inline-flex items-center justify-center",
      "font-semibold tracking-tight",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
      "cursor-pointer select-none whitespace-nowrap",
    ].join(" ");

    const isDisabled = disabled || loading;
    const disabledClass = isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
    const widthClass = fullWidth ? "w-full" : "";

    const classes = [
      base,
      variantClasses[variant],
      sizeClasses[size],
      disabledClass,
      widthClass,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const content = (
      <>
        {loading && <Spinner />}
        {!loading && icon && iconPosition === "left" && (
          <span className="shrink-0" aria-hidden="true">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === "right" && (
          <span className="shrink-0" aria-hidden="true">{icon}</span>
        )}
      </>
    );

    if (href && !isDisabled) {
      return (
        <Link href={href} className={classes}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading}
        {...rest}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
