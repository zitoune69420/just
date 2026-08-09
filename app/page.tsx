import { Suspense } from "react";
import { HeroCarousel } from "@/components/hero-carousel";
import { MediaRow } from "@/components/media-row";
import { SetupNotice } from "@/components/setup-notice";
import {
  HeroSkeleton,
  RowSkeleton,
  TopRowSkeleton,
} from "@/components/skeletons";
import { TopMediaRow } from "@/components/top-media-row";
import { toMedia } from "@/lib/media";
import { getRecentProgress } from "@/lib/progress";
import { getSession } from "@/lib/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import {
  getMediaSummary,
  getPopularMovies,
  getPopularTv,
  getTopRatedMovies,
  getTrending,
  isTmdbConfigured,
} from "@/lib/tmdb";
import type { Media } from "@/lib/types";

export default function HomePage() {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <Suspense fallback={null}>
        <ContinueRow />
      </Suspense>
      <Suspense fallback={<TopRowSkeleton />}>
        <TrendingTopRow />
      </Suspense>
      <Suspense fallback={<RowSkeleton />}>
        <PopularMoviesRow />
      </Suspense>
      <Suspense fallback={<RowSkeleton />}>
        <PopularSeriesRow />
      </Suspense>
      <Suspense fallback={<RowSkeleton />}>
        <TopRatedRow />
      </Suspense>
    </div>
  );
}

async function Hero() {
  const trending = await getTrending();
  const items = trending
    .filter((item) => item.backdrop_path)
    .slice(0, 5)
    .map((item) => toMedia(item));
  return <HeroCarousel items={items} />;
}

async function ContinueRow() {
  if (!isSupabaseAdminConfigured()) return null;

  const session = await getSession();
  if (!session) return null;

  let entries: Awaited<ReturnType<typeof getRecentProgress>>;
  try {
    entries = await getRecentProgress(session.id);
  } catch {
    return null;
  }

  if (entries.length === 0) return null;

  const summaries = await Promise.all(
    entries.map((entry) => getMediaSummary(entry.mediaType, entry.tmdbId)),
  );

  const items = summaries
    .map((summary, index): Media | null => {
      if (!summary) return null;
      const entry = entries[index];
      const ratio =
        entry.durationSeconds && entry.durationSeconds > 0
          ? entry.positionSeconds / entry.durationSeconds
          : 0;
      return { ...toMedia(summary, entry.mediaType), progress: ratio };
    })
    .filter((media): media is Media => media !== null);

  return <MediaRow title="Reprendre" items={items} />;
}

async function TrendingTopRow() {
  const trending = await getTrending();
  return (
    <TopMediaRow
      title="Top 10 de la semaine"
      items={trending.slice(0, 10).map((item) => toMedia(item))}
    />
  );
}

async function PopularMoviesRow() {
  const data = await getPopularMovies();
  return (
    <MediaRow
      title="Films populaires"
      moreHref="/movies"
      items={data.results.map((item) => toMedia(item, "movie"))}
    />
  );
}

async function PopularSeriesRow() {
  const data = await getPopularTv();
  return (
    <MediaRow
      title="Séries populaires"
      moreHref="/series"
      items={data.results.map((item) => toMedia(item, "tv"))}
    />
  );
}

async function TopRatedRow() {
  const data = await getTopRatedMovies();
  return (
    <MediaRow
      title="Les mieux notés"
      items={data.results.map((item) => toMedia(item, "movie"))}
    />
  );
}
