import { isMediaType } from "@/lib/collections";
import { cacheHeaders } from "@/lib/http-cache";
import { getLocale } from "@/lib/i18n/server";
import { toMedia } from "@/lib/media";
import { allowByIp, MINUTE, tooManyRequests } from "@/lib/rate-limit";
import { discoverMedia, isTmdbConfigured, type SortKey } from "@/lib/tmdb";
import type { Media } from "@/lib/types";

const QUOTA = { limit: 60, windowMs: MINUTE };

const MAX_PAGE = 500;

const SORT_KEYS: SortKey[] = ["popularity", "rating", "year", "title"];

export interface CatalogPayload {
  items: Media[];
  totalPages: number;
}

const EMPTY: CatalogPayload = { items: [], totalPages: 0 };

function parsePage(value: string | null): number {
  const page = Number(value);
  if (!Number.isInteger(page) || page < 1) return 1;
  return Math.min(page, MAX_PAGE);
}

function parseGenres(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

function parseSort(value: string | null): SortKey {
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : "popularity";
}

/**
 * Grille du catalogue, servie séparément de la page.
 *
 * C'est ce qui permet de changer de type, de genre ou de tri sans navigation :
 * seule la grille redemande ses données, la barre de filtres et la bascule ne
 * sont jamais démontées.
 */
export async function GET(request: Request) {
  /** Route publique adossée à une clé TMDB facturée : on borne les appels. */
  if (!(await allowByIp("catalog", QUOTA))) return tooManyRequests(MINUTE);

  if (!isTmdbConfigured()) return Response.json(EMPTY);

  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  if (!isMediaType(type)) return Response.json(EMPTY);

  const data = await discoverMedia(await getLocale(), type, {
    page: parsePage(params.get("page")),
    genreIds: parseGenres(params.get("genres")),
    sort: parseSort(params.get("sort")),
  });

  return Response.json(
    {
      items: data.results.map((item) => toMedia(item, type)),
      totalPages: Math.min(data.total_pages, MAX_PAGE),
    } satisfies CatalogPayload,
    { headers: cacheHeaders(300) },
  );
}
