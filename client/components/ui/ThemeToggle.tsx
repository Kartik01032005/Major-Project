"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { FiSun, FiMoon } from "react-icons/fi";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder of the same size to prevent layout shifts/hydration mismatch
    return (
      <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent shrink-0" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer shrink-0"
      aria-label="Toggle theme"
    >
      {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
}
