"use client";

import React from "react";
import { FiChevronRight } from "react-icons/fi";
import SettingsToggle from "./SettingsToggle";

interface SettingsRowProps {
  id?: string;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  badge?: React.ReactNode;
  valuePreview?: React.ReactNode;
  type?: "link" | "toggle" | "button";
  checked?: boolean;
  onToggle?: (val: boolean) => void;
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  destructive?: boolean;
}

export default function SettingsRow({
  id,
  icon,
  label,
  description,
  badge,
  valuePreview,
  type = "link",
  checked = false,
  onToggle,
  onClick,
  disabled = false,
  disabledReason,
  destructive = false,
}: SettingsRowProps) {
  if (type === "toggle") {
    return (
      <div
        id={id}
        className={[
          "flex items-center justify-between gap-4 py-3.5 px-4 transition-colors",
          disabled ? "opacity-75" : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
        ].join(" ")}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {icon && (
            <span className="mt-0.5 text-slate-500 dark:text-slate-400 flex-shrink-0">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {label}
              </span>
              {badge}
            </div>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
            {disabledReason && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium leading-tight">
                {disabledReason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <SettingsToggle
            ariaLabel={label}
            checked={checked}
            disabled={disabled}
            onChange={(val) => onToggle && onToggle(val)}
          />
        </div>
      </div>
    );
  }

  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "w-full flex items-center justify-between gap-4 py-3.5 px-4 text-left transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-inset",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50",
        destructive
          ? "text-red-600 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/20"
          : "text-slate-900 dark:text-slate-100",
      ].join(" ")}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && (
          <span
            className={[
              "mt-0.5 flex-shrink-0 transition-colors",
              destructive
                ? "text-red-500 dark:text-red-400"
                : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200",
            ].join(" ")}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={[
                "text-sm font-medium",
                destructive ? "text-red-600 dark:text-red-400 font-semibold" : "text-slate-900 dark:text-slate-100",
              ].join(" ")}
            >
              {label}
            </span>
            {badge}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {valuePreview && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {valuePreview}
          </span>
        )}
        <FiChevronRight
          size={16}
          className={[
            "transition-transform group-hover:translate-x-0.5",
            destructive
              ? "text-red-400 dark:text-red-500"
              : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300",
          ].join(" ")}
        />
      </div>
    </button>
  );
}
