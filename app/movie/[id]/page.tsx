import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MediaDetailView } from "@/components/media-detail";
import { SetupNotice } from "@/components/setup-notice";
import { DetailSkeleton } from "@/components/skeletons";
import { getLocale, getLocaleAndTranslator } from "@/lib/i18n/server";
import { toMovieDetails } from "@/lib/media";
import { getMovieDetails, isTmdbConfigured } from "@/lib/tmdb";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isTmdbConfigured()) return {};
  const { id } = await params;
  const movie = await getMovieDetails(await getLocale(), Number(id));
  if (!movie) return {};
  const description = movie.overview || undefined;
  return {
    title: movie.title,
    description,
    openGraph: { title: movie.title, description, type: "video.movie" },
  };
}

export default function MoviePage({ params }: PageProps) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <Suspense fallback={<DetailSkeleton />}>
      {params.then(({ id }) => (
        <MovieContent id={Number(id)} />
      ))}
    </Suspense>
  );
}

async function MovieContent({ id }: { id: number }) {
  if (!Number.isInteger(id) || id <= 0) notFound();
  const { locale, t } = await getLocaleAndTranslator();
  const movie = await getMovieDetails(locale, id);
  if (!movie) notFound();
  return <MediaDetailView details={toMovieDetails(movie, { locale, t })} />;
}
