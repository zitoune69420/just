import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@appica/ui-react/button";
import { ChevronLeft, ChevronRight, FilterOff } from "@appica/icons-react";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { toMedia } from "@/lib/media";
import { discoverMedia, getGenres, type SortKey } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";
import { CatalogFilters } from "./catalog-filters";
import { MediaCard } from "./media-card";
import { CatalogSkeleton } from "./skeletons";

const MAX_PAGE = 500;

const SORT_KEYS: SortKey[] = ["popularity", "rating", "year", "title"];

export interface CatalogSearchParams {
  page?: string;
  genres?: string;
  sort?: string;
}

interface CatalogProps {
  type: MediaType;
  basePath: "/movies" | "/series";
  searchParams: Promise<CatalogSearchParams>;
}

export function Catalog({ type, basePath, searchParams }: CatalogProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<CatalogSkeleton />}>
        {searchParams.then((params) => (
          <CatalogResults
            type={type}
            basePath={basePath}
            page={parsePage(params.page)}
            genreIds={parseGenres(params.genres)}
            sort={parseSort(params.sort)}
          />
        ))}
      </Suspense>
    </div>
  );
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return Math.min(page, MAX_PAGE);
}

function parseGenres(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

function parseSort(value: string | undefined): SortKey {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : "popularity";
}

function pageHref(
  basePath: string,
  page: number,
  genreIds: number[],
  sort: SortKey,
): string {
  const params = new URLSearchParams();
  if (genreIds.length > 0) params.set("genres", genreIds.join(","));
  if (sort !== "popularity") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

async function CatalogResults({
  type,
  basePath,
  page,
  genreIds,
  sort,
}: {
  type: MediaType;
  basePath: "/movies" | "/series";
  page: number;
  genreIds: number[];
  sort: SortKey;
}) {
  const { locale, t } = await getLocaleAndTranslator();
  const [genres, data] = await Promise.all([
    getGenres(locale, type),
    discoverMedia(locale, type, { page, genreIds, sort }),
  ]);
  const items = data.results.map((item) => toMedia(item, type));
  const totalPages = Math.min(data.total_pages, MAX_PAGE);

  const hasActiveFilters = genreIds.length > 0 || sort !== "popularity";

  return (
    <div className="enter flex flex-col gap-8 lg:flex-row lg:items-start">
      <CatalogFilters
        basePath={basePath}
        genres={genres}
        selectedGenreIds={genreIds}
        sort={sort}
      />

      <div className="min-w-0 flex-1 space-y-8">
        {items.length === 0 ? (
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
                render={<Link href={basePath} />}
              >
                <FilterOff size={16} /> {t("catalog.reset")}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
            {items.map((media) => (
              <MediaCard
                key={media.id}
                media={media}
                sizes="(min-width: 1280px) 220px, (min-width: 768px) 30vw, 45vw"
              />
            ))}
          </div>
        )}

        {totalPages > 1 && items.length > 0 && (
          <nav
            aria-label={t("catalog.pagination")}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page <= 1}
              render={
                page > 1 ? (
                  <Link href={pageHref(basePath, page - 1, genreIds, sort)} />
                ) : undefined
              }
            >
              <ChevronLeft size={16} /> {t("catalog.previous")}
            </Button>
            <span className="text-sm text-foreground-muted">
              {t("catalog.page", { page, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={page >= totalPages}
              render={
                page < totalPages ? (
                  <Link href={pageHref(basePath, page + 1, genreIds, sort)} />
                ) : undefined
              }
            >
              {t("catalog.next")} <ChevronRight size={16} />
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}
