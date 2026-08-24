import { Locale, Translations, DEFAULT_LOCALE } from "./types";
import en from "./en";
import kn from "./kn";
import ml from "./ml";
import ta from "./ta";
import te from "./te";
import hi from "./hi";
import mr from "./mr";

export * from "./types";

export const translations: Record<Locale, Translations> = {
  en,
  kn,
  ml,
  ta,
  te,
  hi,
  mr,
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations[DEFAULT_LOCALE];
}
