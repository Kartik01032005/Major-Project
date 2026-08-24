"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Locale, Translations, DEFAULT_LOCALE, LOCALE_STORAGE_KEY, getTranslations } from "@/i18n";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Translations) => string;
  translations: Translations;
}

const defaultFallbackTranslations = getTranslations(DEFAULT_LOCALE);

const defaultFallbackContext: LanguageContextType = {
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: keyof Translations) => defaultFallbackTranslations[key] ?? key,
  translations: defaultFallbackTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
        if (stored && ["en", "kn", "ml", "ta", "te", "hi", "mr"].includes(stored)) {
          return stored;
        }
      } catch (e) {
        console.error("Failed to read language preference from localStorage", e);
      }
    }
    return DEFAULT_LOCALE;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      } catch (e) {
        console.error("Failed to save language preference to localStorage", e);
      }
    }
  }, []);

  const currentTranslations = getTranslations(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: keyof Translations): string => {
      const trans = getTranslations(locale);
      return trans[key] ?? getTranslations(DEFAULT_LOCALE)[key] ?? key;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        translations: currentTranslations,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    return defaultFallbackContext;
  }
  return context;
};

// Convenience export for components
export const useTranslation = () => {
  const { t, locale, setLocale, translations } = useLanguage();
  return { t, locale, setLocale, translations };
};
