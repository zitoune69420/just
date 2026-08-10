import type { Metadata } from "next";
import { Catalog, type CatalogSearchParams } from "@/components/catalog";
import { SetupNotice } from "@/components/setup-notice";
import { isTmdbConfigured } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Series",
};

export default function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return <Catalog type="tv" basePath="/series" searchParams={searchParams} />;
}
