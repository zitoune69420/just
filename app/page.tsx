import { Suspense } from "react";
import { HeroCarousel } from "@/components/hero-carousel";
import { MediaRow } from "@/components/media-row";
import { SetupNotice } from "@/components/setup-notice";
import { HeroSkeleton, RowSkeleton } from "@/components/skeletons";
import { toMedia } from "@/lib/media";
import {
  getPopularMovies,
  getPopularTv,
  getTopRatedMovies,
  getTrending,
  isTmdbConfigured,
} from "@/lib/tmdb";

export default function HomePage() {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<HeroSkeleton />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<RowSkeleton />}>
        <TrendingRow />
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

async function TrendingRow() {
  const trending = await getTrending();
  return (
    <MediaRow
      title="Tendances de la semaine"
      items={trending.slice(5, 20).map((item) => toMedia(item))}
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
