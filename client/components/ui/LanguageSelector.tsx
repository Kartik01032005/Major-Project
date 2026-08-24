"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { useLanguage } from "@/context";
import { LOCALES, Locale } from "@/i18n";

interface LanguageSelectorProps {
  className?: string;
  isMobileDrawer?: boolean;
}

export default function LanguageSelector({ className = "", isMobileDrawer = false }: LanguageSelectorProps) {
  const { locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const currentLocaleInfo = LOCALES.find((l) => l.code === locale) || LOCALES[0];

  const handleSelect = (selectedLocale: Locale) => {
    setLocale(selectedLocale);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        id="language-selector-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select Language"
        className={[
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none",
          "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white",
          "hover:bg-slate-100 dark:hover:bg-slate-800",
          "border border-slate-200/80 dark:border-slate-800",
          "focus-visible:ring-2 focus-visible:ring-red-500",
          isMobileDrawer ? "w-full justify-between py-2.5 px-4" : "",
        ].join(" ")}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-base leading-none" role="img" aria-label="Globe">🌐</span>
          <span>{currentLocaleInfo.native}</span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 dark:text-slate-500"
        >
          <FiChevronDown size={14} />
        </motion.span>
      </button>

      {/* Dropdown Options */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: isMobileDrawer ? 4 : 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobileDrawer ? 4 : 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={[
              "absolute z-50 mt-1 py-1 rounded-xl shadow-xl",
              "bg-white dark:bg-slate-900",
              "border border-slate-200 dark:border-slate-800",
              isMobileDrawer
                ? "left-0 right-0 top-full mt-1"
                : "right-0 top-full w-44",
            ].join(" ")}
            role="listbox"
            aria-label="Language options"
          >
            {LOCALES.map((loc) => {
              const isSelected = loc.code === locale;
              return (
                <button
                  key={loc.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(loc.code)}
                  className={[
                    "w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors",
                    isSelected
                      ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <span>{loc.native}</span>
                    {loc.code !== "en" && (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        ({loc.name})
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <FiCheck size={14} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
