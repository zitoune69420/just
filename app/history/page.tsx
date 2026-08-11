import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { History } from "@appica/icons-react";
import { ClearHistoryButton } from "@/components/clear-history-button";
import { DiscordSignInButton } from "@/components/discord-sign-in";
import { ForgetProgressButton } from "@/components/forget-progress-button";
import { GridSkeleton } from "@/components/skeletons";
import { getSession } from "@/lib/auth";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locales";
import { tmdbImage, toMedia } from "@/lib/media";
import { getProgressHistory } from "@/lib/progress";
import { resolveResume } from "@/lib/resume";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { getMediaSummary, isTmdbConfigured } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "History",
};

interface HistoryParams {
  page?: string;
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 0;
}

export default function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<HistoryParams>;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<GridSkeleton count={6} />}>
        {searchParams.then((params) => (
          <HistoryContent page={parsePage(params.page)} />
        ))}
      </Suspense>
    </div>
  );
}

function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-background-muted text-foreground-subtle">
        <History size={30} />
      </div>
      <p className="text-lg font-medium text-foreground-strong">{title}</p>
      <p className="max-w-sm text-sm text-foreground-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

async function HistoryContent({ page }: { page: number }) {
  const { locale, t } = await getLocaleAndTranslator();
  const user = await getSession();

  const header = (clearable: boolean) => (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("history.title")}
        </h1>
        <p className="text-sm text-foreground-muted">
          {t("history.descriptionLong")}
        </p>
      </div>
      {clearable && <ClearHistoryButton />}
    </header>
  );

  if (!user) {
    return (
      <>
        {header(false)}
        <Empty
          title={t("history.signInRequired")}
          description={t("history.signInHint")}
          action={
            <DiscordSignInButton
              label={t("auth.discord")}
              returnTo="/history"
            />
          }
        />
      </>
    );
  }

  if (!isSupabaseAdminConfigured() || !isTmdbConfigured()) {
    return (
      <>
        {header(false)}
        <div className="max-w-lg space-y-4 rounded-3xl border border-border bg-background-subtle p-8">
          <Badge variant="soft" className="rounded-full">
            {t("history.configRequired")}
          </Badge>
          <p className="text-sm text-foreground-muted">
            {t("history.configHint")}
          </p>
        </div>
      </>
    );
  }

  const { entries, hasMore } = await getProgressHistory(user.id, page);

  if (entries.length === 0) {
    return (
      <>
        {header(false)}
        <Empty
          title={t("history.empty")}
          description={t("history.emptyHint")}
          action={
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              render={<Link href="/catalog/movies" />}
            >
              {t("history.browse")}
            </Button>
          }
        />
      </>
    );
  }

  const [summaries, resumes] = await Promise.all([
    Promise.all(
      entries.map((entry) =>
        getMediaSummary(locale, entry.mediaType, entry.tmdbId),
      ),
    ),
    Promise.all(entries.map((entry) => resolveResume(locale, entry))),
  ]);

  const rows = entries
    .map((entry, index) => {
      const summary = summaries[index];
      if (!summary) return null;
      return {
        entry,
        resume: resumes[index],
        media: toMedia(summary, entry.mediaType),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <>
      {header(true)}

      <ul className="enter divide-y divide-border/60">
        {rows.map(({ entry, resume, media }) => (
          <li
            key={`${media.type}-${media.id}`}
            className="flex items-center gap-4 py-3"
          >
            <div className="relative w-16 shrink-0 overflow-hidden rounded-xl bg-background-muted">
              <Link href={`/${media.type}/${media.id}`}>
                {media.poster ? (
                  <Image
                    src={tmdbImage(media.poster, "w185")}
                    alt=""
                    width={64}
                    height={96}
                    className="aspect-[2/3] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[2/3] w-full" />
                )}
              </Link>
              {/* Barre d'avancement : muette quand la durée n'est pas connue. */}
              {resume.ratio > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1 bg-white/25"
                >
                  <span
                    className="block h-full bg-accent"
                    style={{ width: `${Math.round(resume.ratio * 100)}%` }}
                  />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/${media.type}/${media.id}`}
                className="truncate text-sm font-medium text-foreground-strong outline-none hover:underline focus-visible:underline"
              >
                {media.title}
              </Link>
              <p className="mt-0.5 truncate text-xs text-foreground-muted">
                {[resume.label, formatDate(locale, entry.updatedAt)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <ForgetProgressButton
              mediaType={media.type}
              tmdbId={media.id}
              title={media.title}
              className="shrink-0"
            />
          </li>
        ))}
      </ul>

      {(page > 0 || hasMore) && (
        <nav className="flex items-center justify-between gap-3">
          {page > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              render={<Link href={`/history?page=${page - 1}`} />}
            >
              {t("history.previous")}
            </Button>
          ) : (
            <span />
          )}
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              render={<Link href={`/history?page=${page + 1}`} />}
            >
              {t("history.next")}
            </Button>
          )}
        </nav>
      )}
    </>
  );
}
