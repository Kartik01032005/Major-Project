"use client";

import React from "react";
import { FiGlobe, FiCheck } from "react-icons/fi";
import SettingsModal from "./SettingsModal";
import { useLanguage } from "@/context";
import { LOCALES, Locale } from "@/i18n";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageModal({ isOpen, onClose }: LanguageModalProps) {
  const { locale, setLocale } = useLanguage();

  const handleSelect = (code: Locale) => {
    setLocale(code);
    onClose();
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="Language"
      description="Select your preferred application language."
      icon={<FiGlobe size={20} />}
    >
      <div className="space-y-3">
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {LOCALES.map((item) => {
            const isSelected = locale === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={[
                  "w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-red-600 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200 ring-2 ring-red-500/30"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900",
                ].join(" ")}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.native}
                  </p>
                </div>
                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center">
                    <FiCheck size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </SettingsModal>
  );
}
