import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser, type CatalogState } from "@/components/catalog-browser";
import { SetupNotice } from "@/components/setup-notice";
import { CatalogSkeleton } from "@/components/skeletons";
import { getLocale } from "@/lib/i18n/server";
import { toMedia } from "@/lib/media";
import { discoverMedia, getGenres, isTmdbConfigured, type SortKey } from "@/lib/tmdb";
import { isMediaType } from "@/lib/collections";
import type { MediaType } from "@/lib/types";

export const metadata: Metadata = {
  title: "Catalog",
};

const MAX_PAGE = 500;

const SORT_KEYS: SortKey[] = ["popularity", "rating", "year", "title"];

interface CatalogParams {
  type?: string;
  page?: string;
  genres?: string;
  sort?: string;
}

function parseState(params: CatalogParams): CatalogState {
  const page = Number(params.page);
  const type: MediaType = isMediaType(params.type) ? params.type : "movie";

  return {
    type,
    page: Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
    genreIds: (params.genres ?? "")
      .split(",")
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0),
    sort: SORT_KEYS.includes(params.sort as SortKey)
      ? (params.sort as SortKey)
      : "popularity",
  };
}

export default function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogParams>;
}) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<CatalogSkeleton />}>
        {searchParams.then((params) => (
          <CatalogContent state={parseState(params)} />
        ))}
      </Suspense>
    </div>
  );
}

/**
 * Un seul rendu serveur, à l'arrivée sur la page : listes de genres des deux
 * types et première grille. Tout ce qui suit — changement de type, de genre, de
 * tri, de page — est traité par le client sans repasser par ici.
 *
 * Les genres des deux types sont chargés d'avance parce que la bascule
 * films/séries ne navigue plus : le client doit pouvoir remplir la barre de
 * filtres immédiatement, sans aller-retour supplémentaire.
 */
async function CatalogContent({ state }: { state: CatalogState }) {
  const locale = await getLocale();

  const [movieGenres, tvGenres, data] = await Promise.all([
    getGenres(locale, "movie"),
    getGenres(locale, "tv"),
    discoverMedia(locale, state.type, {
      page: state.page,
      genreIds: state.genreIds,
      sort: state.sort,
    }),
  ]);

  return (
    <CatalogBrowser
      initial={state}
      initialItems={data.results.map((item) => toMedia(item, state.type))}
      initialTotalPages={Math.min(data.total_pages, MAX_PAGE)}
      genresByType={{ movie: movieGenres, tv: tvGenres }}
    />
  );
}
