import Image from "next/image";
import Link from "next/link";
import { CalendarEvent } from "@appica/icons-react";
import { INTL_LOCALE, type Locale } from "@/lib/i18n/locales";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { tmdbImage } from "@/lib/media";
import type { UpcomingEpisode } from "@/lib/types";

function formatAirDate(value: string, locale: Locale): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parsed);
}

export async function UpcomingEpisodes({
  episodes,
}: {
  episodes: UpcomingEpisode[];
}) {
  if (episodes.length === 0) return null;

  const { locale, t } = await getLocaleAndTranslator();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
        {t("new.upcomingEpisodes")}
      </h2>
      <ul className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2">
        {episodes.map((episode) => (
          <li key={`${episode.tmdbId}-${episode.season}-${episode.episode}`}>
            <Link
              href={`/tv/${episode.tmdbId}`}
              className="press group flex h-full gap-3 rounded-2xl border border-border/60 bg-background-subtle/60 p-2.5 outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="relative aspect-2/3 w-14 shrink-0 overflow-hidden rounded-xl bg-background-muted">
                {episode.poster && (
                  <Image
                    src={tmdbImage(episode.poster, "w185")}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1 space-y-1 py-0.5">
                <span className="block truncate text-sm font-medium text-foreground-strong">
                  {episode.series}
                </span>
                <span className="block truncate text-xs text-foreground-muted">
                  S{episode.season} E{episode.episode} · {episode.title}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-foreground-subtle">
                  <CalendarEvent size={14} className="shrink-0" />
                  {formatAirDate(episode.airDate, locale)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
