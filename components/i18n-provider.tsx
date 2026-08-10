"use client";

import { createContext, use, useMemo } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";
import {
  createTranslator,
  getMessages,
  type Messages,
  type Translate,
} from "@/lib/i18n/translate";

interface I18nValue {
  locale: Locale;
  messages: Messages;
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  messages: getMessages(DEFAULT_LOCALE),
});

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext value={value}>{children}</I18nContext>;
}

export function useLocale(): Locale {
  return use(I18nContext).locale;
}

export function useTranslations(): Translate {
  const { messages } = use(I18nContext);
  return useMemo(() => createTranslator(messages), [messages]);
}
