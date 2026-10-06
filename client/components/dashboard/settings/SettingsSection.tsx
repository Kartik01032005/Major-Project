"use client";

import React from "react";

interface SettingsSectionProps {
  id?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function SettingsSection({
  id,
  title,
  description,
  icon,
  children,
}: SettingsSectionProps) {
  return (
    <section id={id} className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        {icon && <span className="text-red-600 dark:text-red-400 text-sm">{icon}</span>}
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-xs text-slate-400 dark:text-slate-500 px-1 -mt-1">
          {description}
        </p>
      )}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
        {children}
      </div>
    </section>
  );
}
