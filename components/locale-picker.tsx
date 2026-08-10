"use client";

import Image from "next/image";
import { useTransition } from "react";
import { Button } from "@appica/ui-react/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@appica/ui-react/dropdown-menu";
import { Check } from "@appica/icons-react";
import { setLocale } from "@/lib/i18n/locale-actions";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/lib/i18n/locales";
import { useLocale, useTranslations } from "./i18n-provider";

const FLAGS: Record<Locale, string> = {
  en: "/usa-flag.png",
  fr: "/french-flag.png",
};

export function LocaleFlag({
  locale,
  size = 18,
}: {
  locale: Locale;
  size?: number;
}) {
  return (
    <Image
      src={FLAGS[locale]}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/** Entrées de langue à placer dans le menu du compte. */
export function LocaleMenuItems() {
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <>
      {LOCALES.map((locale) => (
        <DropdownMenuItem
          key={locale}
          disabled={pending}
          closeOnClick={false}
          onClick={() => startTransition(() => setLocale(locale))}
        >
          <LocaleFlag locale={locale} />
          {LOCALE_LABELS[locale]}
          {locale === current && (
            <Check size={16} className="ms-auto text-success" />
          )}
        </DropdownMenuItem>
      ))}
    </>
  );
}

/** Sélecteur autonome, pour les visiteurs qui n'ont pas de menu de compte. */
export function LocaleToggle() {
  const current = useLocale();
  const t = useTranslations();

  return (
    <DropdownMenu size="sm">
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label={t("session.language")}
          >
            <LocaleFlag locale={current} size={20} />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <LocaleMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
