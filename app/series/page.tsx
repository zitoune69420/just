import type { Metadata } from "next";
import { Catalog, type CatalogSearchParams } from "@/components/catalog";
import { SetupNotice } from "@/components/setup-notice";
import { isTmdbConfigured } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Séries",
  description: "Explorez les séries populaires, filtrées par genre.",
};

export default function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <Catalog
      type="tv"
      title="Séries"
      description="Les séries du moment, à filtrer par genre."
      basePath="/series"
      searchParams={searchParams}
    />
  );
}
