import { Badge } from "@appica/ui-react/badge";
import { getTranslator } from "@/lib/i18n/server";

export async function SetupNotice() {
  const t = await getTranslator();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-24">
      <div className="max-w-lg space-y-5 rounded-3xl border border-border bg-background-subtle p-8 sm:p-10">
        <Badge variant="soft" className="rounded-full">
          {t("setup.title")}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("setup.tmdbMissing")}
        </h1>
        <ol className="list-decimal space-y-2 ps-5 text-sm text-foreground-muted">
          <li>
            {t("setup.step1")}{" "}
            <a
              href="https://www.themoviedb.org/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground-strong underline underline-offset-4"
            >
              themoviedb.org
            </a>
          </li>
          <li>{t("setup.step2")}</li>
          <li>{t("setup.step3")}</li>
        </ol>
        <pre className="overflow-x-auto rounded-2xl bg-background-muted p-4 text-sm">
          <code>TMDB_API_KEY=…</code>
        </pre>
        <p className="text-sm text-foreground-muted">
          {t("setup.restart")}{" "}
          <code className="rounded-md bg-background-muted px-1.5 py-0.5">
            npm run dev
          </code>
          .
        </p>
      </div>
    </div>
  );
}
