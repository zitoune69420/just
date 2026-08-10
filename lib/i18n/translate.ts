import { en, type MessageKey, type Messages } from "./messages/en";
import { fr } from "./messages/fr";
import type { Locale } from "./locales";

export type { MessageKey, Messages };

export type Vars = Record<string, string | number>;

export type Translate = (key: MessageKey, vars?: Vars) => string;

const CATALOGUES: Record<Locale, Messages> = { en, fr };

export function getMessages(locale: Locale): Messages {
  return CATALOGUES[locale];
}

const PLACEHOLDER = /\{(\w+)\}/g;

function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export function createTranslator(messages: Messages): Translate {
  return (key, vars) => format(messages[key] ?? key, vars);
}

/**
 * Choisit entre `key` et `key.plural` selon `count`, puis interpole. Les deux
 * langues gérées partagent la même règle (1 = singulier).
 */
export function plural(
  translate: Translate,
  key: MessageKey,
  count: number,
  vars?: Vars,
): string {
  const pluralKey = `${key}.plural` as MessageKey;
  const usePlural = count > 1 && pluralKey in en;
  return translate(usePlural ? pluralKey : key, { count, ...vars });
}
