import type { Metadata } from "next";
import { Catalog, type CatalogSearchParams } from "@/components/catalog";
import { SetupNotice } from "@/components/setup-notice";
import { isTmdbConfigured } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Movies",
};

export default function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return <Catalog type="movie" basePath="/movies" searchParams={searchParams} />;
}
