import { Suspense } from "react";
import { BetaNotice } from "@/components/beta-notice";
import { ContinueRow } from "@/components/continue-row";
import { HeroCarousel } from "@/components/hero-carousel";
import { MediaRow } from "@/components/media-row";
import { SetupNotice } from "@/components/setup-notice";
import {
  HeroSkeleton,
  RowSkeleton,
  TopRowSkeleton,
} from "@/components/skeletons";
import { TopMediaRow } from "@/components/top-media-row";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { toMedia } from "@/lib/media";
import { getRecentProgress } from "@/lib/progress";
import { resolveResume } from "@/lib/resume";
import {
  getBecauseYouWatched,
  getCollaborative,
  getForYou,
} from "@/lib/recommendations";
import { getFollowedReleases } from "@/lib/following-releases";
import { getSession } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import {
  getMediaSummary,
  getNowPlayingMovies,
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
      <BetaNotice />
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <Suspense fallback={null}>
        <ContinueWatchingRow />
      </Suspense>
      <Suspense fallback={<TopRowSkeleton />}>
        <TrendingTopRow />
      </Suspense>
      <Suspense fallback={null}>
        <BecauseYouWatchedRow />
      </Suspense>
      <Suspense fallback={null}>
        <ForYouRow />
      </Suspense>
      <Suspense fallback={null}>
        <CollaborativeRow />
      </Suspense>
      <Suspense fallback={null}>
        <FollowedPeopleRow />
      </Suspense>
      <Suspense fallback={<RowSkeleton />}>
        <NewReleasesRow />
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
  const { locale } = await getLocaleAndTranslator();
  const trending = await getTrending(locale);
  const items = trending
    .filter((item) => item.backdrop_path)
    .slice(0, 5)
    .map((item) => toMedia(item));
  return <HeroCarousel items={items} />;
}

/** Identifiant du compte connecté, si la base et la session le permettent. */
async function currentUserId(): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const session = await getSession();
  return session?.id ?? null;
}

async function ContinueWatchingRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const userId = await currentUserId();
  if (!userId) return null;

  let entries: Awaited<ReturnType<typeof getRecentProgress>>;
  try {
    entries = await getRecentProgress(userId);
  } catch {
    return null;
  }

  if (entries.length === 0) return null;

  /**
   * La rangée annonce l'épisode à reprendre, pas le dernier lancé : quand le
   * précédent est fini, `resolveResume` renvoie déjà le suivant.
   */
  const [summaries, resumes] = await Promise.all([
    Promise.all(
      entries.map((entry) =>
        getMediaSummary(locale, entry.mediaType, entry.tmdbId),
      ),
    ),
    Promise.all(entries.map((entry) => resolveResume(locale, entry))),
  ]);

  const items = summaries
    .map((summary, index): Media | null => {
      if (!summary) return null;
      const entry = entries[index];
      const resume = resumes[index];
      return {
        ...toMedia(summary, entry.mediaType),
        progress: resume.ratio,
        resumeLabel: resume.label ?? undefined,
      };
    })
    .filter((media): media is Media => media !== null);

  return <ContinueRow title={t("home.continue")} items={items} />;
}

async function BecauseYouWatchedRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const userId = await currentUserId();
  if (!userId) return null;

  let recommendations: Awaited<ReturnType<typeof getBecauseYouWatched>>;
  try {
    recommendations = await getBecauseYouWatched(locale, userId);
  } catch {
    return null;
  }

  if (!recommendations || recommendations.items.length === 0) return null;

  return (
    <MediaRow
      title={t("home.becauseYouWatched", { title: recommendations.seed.title })}
      items={recommendations.items}
    />
  );
}

async function ForYouRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const userId = await currentUserId();
  if (!userId) return null;

  let items: Awaited<ReturnType<typeof getForYou>>;
  try {
    items = await getForYou(locale, userId);
  } catch {
    return null;
  }

  return <MediaRow title={t("home.forYou")} items={items} />;
}

async function CollaborativeRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const userId = await currentUserId();
  if (!userId) return null;

  let items: Awaited<ReturnType<typeof getCollaborative>>;
  try {
    items = await getCollaborative(locale, userId);
  } catch {
    return null;
  }

  if (items.length === 0) return null;

  return <MediaRow title={t("home.viewersLikeYou")} items={items} />;
}

async function FollowedPeopleRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const userId = await currentUserId();
  if (!userId) return null;

  let items: Awaited<ReturnType<typeof getFollowedReleases>>;
  try {
    items = await getFollowedReleases(locale, userId);
  } catch {
    return null;
  }

  if (items.length === 0) return null;

  return <MediaRow title={t("home.fromPeopleYouFollow")} items={items} />;
}

async function TrendingTopRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const trending = await getTrending(locale);
  return (
    <TopMediaRow
      title={t("home.top10")}
      items={trending.slice(0, 10).map((item) => toMedia(item))}
    />
  );
}

async function NewReleasesRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const data = await getNowPlayingMovies(locale);
  return (
    <MediaRow
      title={t("home.newReleases")}
      moreHref="/new"
      items={data.results.map((item) => toMedia(item, "movie"))}
    />
  );
}

async function PopularMoviesRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const data = await getPopularMovies(locale);
  return (
    <MediaRow
      title={t("home.popularMovies")}
      moreHref="/catalog/movies"
      items={data.results.map((item) => toMedia(item, "movie"))}
    />
  );
}

async function PopularSeriesRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const data = await getPopularTv(locale);
  return (
    <MediaRow
      title={t("home.popularSeries")}
      moreHref="/catalog/series"
      items={data.results.map((item) => toMedia(item, "tv"))}
    />
  );
}

async function TopRatedRow() {
  const { locale, t } = await getLocaleAndTranslator();
  const data = await getTopRatedMovies(locale);
  return (
    <MediaRow
      title={t("home.topRated")}
      items={data.results.map((item) => toMedia(item, "movie"))}
    />
  );
}
