import type { Metadata } from "next";
import { Catalog, type CatalogSearchParams } from "@/components/catalog";
import { SetupNotice } from "@/components/setup-notice";
import { isTmdbConfigured } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Films",
  description: "Explorez les films populaires, filtrés par genre.",
};

export default function MoviesPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <Catalog
      type="movie"
      title="Films"
      description="Les films du moment, à filtrer par genre."
      basePath="/movies"
      searchParams={searchParams}
    />
  );
}
