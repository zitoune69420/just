import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MediaDetailView } from "@/components/media-detail";
import { SetupNotice } from "@/components/setup-notice";
import { DetailSkeleton } from "@/components/skeletons";
import { toMovieDetails } from "@/lib/media";
import { getMovieDetails, isTmdbConfigured } from "@/lib/tmdb";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isTmdbConfigured()) return { title: "Film" };
  const { id } = await params;
  const movie = await getMovieDetails(Number(id));
  if (!movie) return { title: "Film introuvable" };
  return { title: movie.title, description: movie.overview || undefined };
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
  const movie = await getMovieDetails(id);
  if (!movie) notFound();
  return <MediaDetailView details={toMovieDetails(movie)} />;
}
