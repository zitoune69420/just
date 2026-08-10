"use client";

import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { AlertTriangle, Refresh } from "@appica/icons-react";
import { useTranslations } from "@/components/i18n-provider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  return (
    <div className="enter flex flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <div className="grid size-16 place-items-center rounded-3xl bg-background-muted text-foreground-subtle">
        <AlertTriangle size={35} />
      </div>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("error.title")}
      </h1>
      <p className="max-w-md text-foreground-muted text-balance">
        {t("error.hint")}
      </p>

      {(error.message || error.digest) && (
        <div className="max-w-md space-y-1.5 rounded-2xl bg-background-muted px-4 py-3 text-start">
          {error.message && (
            <p className="font-mono text-xs break-words text-foreground-muted">
              {error.message}
            </p>
          )}
          {error.digest && (
            <p className="font-mono text-xs text-foreground-subtle">
              {t("error.digest", { digest: error.digest })}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
        <Button className="rounded-full" onClick={reset}>
          <Refresh size={18} /> {t("error.retry")}
        </Button>
        <Button
          variant="ghost"
          className="rounded-full"
          render={<Link href="/" />}
        >
          {t("notFound.home")}
        </Button>
      </div>
    </div>
  );
}
