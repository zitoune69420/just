export const LOCALES = ["en", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

/** Anglais par défaut : c'est la langue servie sans cookie de préférence. */
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "just_locale";

export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  fr: "Français",
};

/** Code passé à TMDB (`language=`). */
export const TMDB_LANGUAGE: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
};

/** Étiquette BCP 47 pour `Intl`. */
export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
