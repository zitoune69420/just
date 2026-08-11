import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@appica/ui-react/skeleton";
import { MediaRow } from "@/components/media-row";
import { SetupNotice } from "@/components/setup-notice";
import { RowSkeleton } from "@/components/skeletons";
import { UpcomingEpisodes } from "@/components/upcoming-episodes";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { toMedia } from "@/lib/media";
import { getSession } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import {
  getAiringTodayTv,
  getNowPlayingMovies,
  getOnTheAirTv,
  getUpcomingMovies,
  isTmdbConfigured,
} from "@/lib/tmdb";
import { getUpcomingEpisodes } from "@/lib/upcoming";

export const metadata: Metadata = {
  title: "New",
};

export default function NewPage() {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<HeaderSkeleton />}>
        <PageHeader />
      </Suspense>

      <Suspense fallback={<EpisodesSkeleton />}>
        <FollowedEpisodes />
      </Suspense>

      <Suspense fallback={<RowSkeleton />}>
        <NowPlayingRow />
      </Suspense>
      <Suspense fallback={<RowSkeleton />}>
        <UpcomingMoviesRow />
      </Suspense>
      <Suspense fallback={<RowSkeleton />}>
        <AiringTodayRow />
      </Suspense>
      <Suspense fallback={<RowSkeleton />}>
        <OnTheAirRow />
      </Suspense>
    </div>
  );
}

function EpisodesSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-56 rounded-full" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-56 rounded-2xl" />
      <Skeleton className="h-4 w-96 max-w-full rounded-full" />
    </div>
  );
}

async function PageHeader() {
  const { t } = await getLocaleAndTranslator();
  return (
    <header className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("new.title")}
      </h1>
      <p className="text-sm text-foreground-muted">{t("new.description")}</p>
    </header>
  );
}

async function FollowedEpisodes() {
  if (!isSupabaseAdminConfigured()) return null;

  const { locale } = await getLocaleAndTranslator();
  const session = await getSession();
  if (!session) return null;

  let episodes: Awaited<ReturnType<typeof getUpcomingEpisodes>>;
  try {
    episodes = await getUpcomingEpisodes(locale, session.id);
  } catch {
    return null;
  }

  return <UpcomingEpisodes episodes={episodes} />;
}

async function NowPlayingRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const data = await getNowPlayingMovies(locale);
  return (
    <MediaRow
      title={t("new.nowPlaying")}
      moreHref="/catalog/movies"
      items={data.results.map((item) => toMedia(item, "movie"))}
    />
  );
}

async function UpcomingMoviesRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const data = await getUpcomingMovies(locale);
  return (
    <MediaRow
      title={t("new.upcomingMovies")}
      items={data.results.map((item) => toMedia(item, "movie"))}
    />
  );
}

async function AiringTodayRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const data = await getAiringTodayTv(locale);
  return (
    <MediaRow
      title={t("new.airingToday")}
      items={data.results.map((item) => toMedia(item, "tv"))}
    />
  );
}

async function OnTheAirRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const data = await getOnTheAirTv(locale);
  return (
    <MediaRow
      title={t("new.onTheAir")}
      moreHref="/catalog/series"
      items={data.results.map((item) => toMedia(item, "tv"))}
    />
  );
}
