import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalog, type CatalogSearchParams } from "@/components/catalog";
import { SetupNotice } from "@/components/setup-notice";
import { isTmdbConfigured } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";

/**
 * Films et séries partagent une seule entrée de navigation. Le type vit dans
 * le chemin plutôt que dans la requête : la pagination et les filtres
 * construisent leurs adresses à partir de `basePath`, qui reste ainsi complet.
 */
const TYPES: Record<string, { media: MediaType; title: string }> = {
  movies: { media: "movie", title: "Movies" },
  series: { media: "tv", title: "Series" },
};

type PageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<CatalogSearchParams>;
};

export function generateStaticParams() {
  return Object.keys(TYPES).map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { type } = await params;
  return { title: TYPES[type]?.title ?? "Catalog" };
}

export default async function CatalogPage({ params, searchParams }: PageProps) {
  const { type } = await params;
  const entry = TYPES[type];
  if (!entry) notFound();

  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <Catalog
      type={entry.media}
      basePath={`/catalog/${type}`}
      searchParams={searchParams}
    />
  );
}
