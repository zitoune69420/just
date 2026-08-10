import { cookies } from "next/headers";
import { LOCALE_COOKIE, toLocale, type Locale } from "./locales";
import { createTranslator, getMessages, type Translate } from "./translate";

/**
 * Langue du cookie de préférence, anglais à défaut. Appelle `cookies()` : à
 * n'utiliser que dans une portée dynamique (jamais dans un `use cache`).
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return toLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getTranslator(): Promise<Translate> {
  return createTranslator(getMessages(await getLocale()));
}

export async function getLocaleAndTranslator(): Promise<{
  locale: Locale;
  t: Translate;
}> {
  const locale = await getLocale();
  return { locale, t: createTranslator(getMessages(locale)) };
}
