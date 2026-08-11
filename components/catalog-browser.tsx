"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@appica/ui-react/button";
import { ChevronLeft, ChevronRight, FilterOff } from "@appica/icons-react";
import type { CatalogPayload } from "@/app/api/catalog/route";
import type { SortKey } from "@/lib/tmdb";
import type { Media, MediaType, TmdbGenre } from "@/lib/types";
import { CatalogFilters } from "./catalog-filters";
import { useTranslations } from "./i18n-provider";
import { MediaCard } from "./media-card";
import { PosterSkeleton } from "./skeletons";

export interface CatalogState {
  type: MediaType;
  genreIds: number[];
  sort: SortKey;
  page: number;
}

const TYPE_TABS: { type: MediaType; key: "nav.movies" | "nav.series" }[] = [
  { type: "movie", key: "nav.movies" },
  { type: "tv", key: "nav.series" },
];

/** Adresse affichée dans la barre du navigateur pour un état donné. */
function stateToQuery(state: CatalogState): string {
  const params = new URLSearchParams();
  if (state.type !== "movie") params.set("type", state.type);
  if (state.genreIds.length > 0) params.set("genres", state.genreIds.join(","));
  if (state.sort !== "popularity") params.set("sort", state.sort);
  if (state.page > 1) params.set("page", String(state.page));
  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

function requestUrl(state: CatalogState): string {
  const params = new URLSearchParams({
    type: state.type,
    sort: state.sort,
    page: String(state.page),
  });
  if (state.genreIds.length > 0) params.set("genres", state.genreIds.join(","));
  return `/api/catalog?${params.toString()}`;
}

/** Signature d'un état, pour savoir ce qui est déjà affiché. */
function stateKey(state: CatalogState): string {
  return [
    state.type,
    state.sort,
    state.page,
    [...state.genreIds].sort((a, b) => a - b).join("."),
  ].join("|");
}

/**
 * Le catalogue entier, piloté côté client.
 *
 * Le type vivait auparavant dans le chemin (`/catalog/movies`), donc en changer
 * remontait tout le segment de route : la barre de filtres et la bascule
 * disparaissaient le temps du rechargement. Ici rien ne navigue — seule la
 * grille redemande ses données à `/api/catalog`, et le reste de la page n'est
 * jamais démonté.
 *
 * La première grille arrive déjà rendue par le serveur (`initialItems`) : on ne
 * refait un aller-retour qu'à partir du premier changement.
 */
export function CatalogBrowser({
  initial,
  initialItems,
  initialTotalPages,
  genresByType,
}: {
  initial: CatalogState;
  initialItems: Media[];
  initialTotalPages: number;
  genresByType: Record<MediaType, TmdbGenre[]>;
}) {
  const t = useTranslations();

  const [state, setState] = useState<CatalogState>(initial);
  const [items, setItems] = useState<Media[]>(initialItems);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);

  /**
   * Signature de ce qui est actuellement à l'écran. Au départ c'est la grille
   * rendue par le serveur, d'où l'absence de requête au montage.
   *
   * La comparaison porte bien sur le dernier état chargé et non sur l'état
   * initial : revenir sur Films après être passé aux Séries redonne exactement
   * l'état de départ, et comparer à celui-ci ferait sauter le rechargement en
   * laissant les séries affichées.
   */
  const loadedKey = useRef(stateKey(initial));

  useEffect(() => {
    const key = stateKey(state);
    if (key === loadedKey.current) return;
    loadedKey.current = key;

    const controller = new AbortController();
    setLoading(true);

    async function load() {
      try {
        const response = await fetch(requestUrl(state), {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`catalogue: ${response.status}`);
        const data = (await response.json()) as CatalogPayload;
        setItems(data.items);
        setTotalPages(data.totalPages);
      } catch {
        // Échec ou annulation : on garde la grille précédente, et on oublie
        // cette signature pour que la même sélection puisse être retentée.
        if (!controller.signal.aborted) loadedKey.current = "";
        return;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [state]);

  /**
   * L'adresse suit l'état pour rester partageable, mais par `replaceState` et
   * non par le routeur : une navigation relancerait le rendu serveur de toute
   * la page, ce que ce composant existe précisément pour éviter.
   */
  useEffect(() => {
    window.history.replaceState(null, "", stateToQuery(state));
  }, [state]);

  const update = useCallback((patch: Partial<CatalogState>) => {
    setState((current) => ({
      ...current,
      ...patch,
      // Tout changement de critère ramène à la première page.
      page: patch.page ?? 1,
    }));
  }, []);

  const hasActiveFilters =
    state.genreIds.length > 0 || state.sort !== "popularity";

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <CatalogFilters
        genres={genresByType[state.type]}
        selectedGenreIds={state.genreIds}
        sort={state.sort}
        busy={loading}
        onGenresChange={(genreIds) => update({ genreIds })}
        onSortChange={(sort) => update({ sort })}
        onReset={() => update({ genreIds: [], sort: "popularity" })}
      />

      <div className="min-w-0 flex-1 space-y-8">
        <div
          role="tablist"
          aria-label={t("catalog.type")}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background-subtle p-1"
        >
          {TYPE_TABS.map((tab) => {
            const active = tab.type === state.type;
            return (
              <button
                key={tab.type}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  if (active) return;
                  /**
                   * Les identifiants de genres TMDB ne désignent pas la même
                   * chose pour les films et les séries : les conserver
                   * produirait un filtre incohérent. Le tri, lui, garde son sens.
                   */
                  update({ type: tab.type, genreIds: [] });
                }}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "bg-background text-foreground-strong shadow-sm"
                    : "text-foreground-muted hover:text-foreground-strong"
                }`}
              >
                {t(tab.key)}
              </button>
            );
          })}
        </div>

        <div
          aria-busy={loading}
          className={`transition-opacity duration-200 ${
            loading ? "opacity-50" : "opacity-100"
          }`}
        >
          {loading && items.length === 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 12 }, (_, index) => (
                <PosterSkeleton key={index} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-24 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-background-muted text-foreground-subtle">
                <FilterOff size={30} />
              </div>
              <p className="text-lg font-medium text-foreground-strong">
                {t("catalog.empty")}
              </p>
              <p className="max-w-sm text-sm text-foreground-muted">
                {t("catalog.emptyHint")}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 rounded-full"
                  onClick={() => update({ genreIds: [], sort: "popularity" })}
                >
                  <FilterOff size={16} /> {t("catalog.reset")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
              {items.map((media) => (
                <MediaCard
                  key={`${media.type}-${media.id}`}
                  media={media}
                  sizes="(min-width: 1280px) 220px, (min-width: 768px) 30vw, 45vw"
                />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && items.length > 0 && (
          <nav
            aria-label={t("catalog.pagination")}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={state.page <= 1 || loading}
              onClick={() => update({ page: state.page - 1 })}
            >
              <ChevronLeft size={16} /> {t("catalog.previous")}
            </Button>
            <span className="text-sm text-foreground-muted">
              {t("catalog.page", { page: state.page, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={state.page >= totalPages || loading}
              onClick={() => update({ page: state.page + 1 })}
            >
              {t("catalog.next")} <ChevronRight size={16} />
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}
