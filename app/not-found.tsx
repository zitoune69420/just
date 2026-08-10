"use client";

import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { Compass, Search } from "@appica/icons-react";
import { useTranslations } from "@/components/i18n-provider";

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="enter flex flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <div className="grid size-16 place-items-center rounded-3xl bg-background-muted text-foreground-subtle">
        <Compass size={35} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground-subtle">{t("notFound.code")}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("notFound.title")}
        </h1>
      </div>
      <p className="max-w-md text-foreground-muted text-balance">
        {t("notFound.hint")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
        <Button className="rounded-full" render={<Link href="/" />}>
          {t("notFound.home")}
        </Button>
        <Button
          variant="ghost"
          className="rounded-full"
          render={<Link href="/search" />}
        >
          <Search size={18} /> {t("notFound.search")}
        </Button>
      </div>
    </div>
  );
}
