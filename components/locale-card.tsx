"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/i18n/locale-actions";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/locales";
import { useLocale } from "./i18n-provider";
import { LocaleFlag } from "./locale-picker";

/** Choix de langue de la page « Mon compte ». */
export function LocaleCard() {
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      {LOCALES.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => startTransition(() => setLocale(locale))}
            className={`press flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 ${
              active
                ? "border-border-strong bg-background-muted text-foreground-strong"
                : "border-border text-foreground-muted hover:text-foreground-strong"
            }`}
          >
            <LocaleFlag locale={locale} size={20} />
            {LOCALE_LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
}
