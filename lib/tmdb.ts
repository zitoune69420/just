import { cacheLife } from "next/cache";
import type {
  MediaType,
  TmdbGenre,
  TmdbListItem,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbPaginated,
  TmdbTvDetails,
  TmdbTvListItem,
} from "./types";

const API_BASE = "https://api.themoviedb.org/3";

class TmdbNotFoundError extends Error {}

export function isTmdbConfigured(): boolean {
  return Boolean(process.env.TMDB_API_KEY);
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TMDB_API_KEY manquante. Ajoutez-la dans .env.local (voir .env.example).",
    );
  }

  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("language", "fr-FR");
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }

  const isV4Token = apiKey.startsWith("eyJ");
  if (!isV4Token) {
    url.searchParams.set("api_key", apiKey);
  }

  const response = await fetch(url, {
    headers: isV4Token ? { Authorization: `Bearer ${apiKey}` } : undefined,
  });

  if (response.status === 404) {
    throw new TmdbNotFoundError(path);
  }
  if (!response.ok) {
    throw new Error(`TMDB a répondu ${response.status} sur ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function getTrending(): Promise<TmdbListItem[]> {
  "use cache";
  cacheLife("hours");
  const data = await tmdbFetch<
    TmdbPaginated<TmdbListItem & { media_type?: string }>
  >("/trending/all/week");
  return data.results.filter(
    (item): item is TmdbListItem =>
      item.media_type === "movie" || item.media_type === "tv",
  );
}

export async function getPopularMovies(
  page = 1,
): Promise<TmdbPaginated<TmdbMovieListItem>> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/movie/popular", { page: String(page) });
}

export async function getPopularTv(
  page = 1,
): Promise<TmdbPaginated<TmdbTvListItem>> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/tv/popular", { page: String(page) });
}

export async function getTopRatedMovies(): Promise<
  TmdbPaginated<TmdbMovieListItem>
> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/movie/top_rated");
}

export async function getAcclaimedMovies(): Promise<
  TmdbPaginated<TmdbMovieListItem>
> {
  "use cache";
  cacheLife("days");
  return tmdbFetch("/discover/movie", {
    sort_by: "vote_average.desc",
    "vote_count.gte": "5000",
  });
}

export async function getGenres(type: MediaType): Promise<TmdbGenre[]> {
  "use cache";
  cacheLife("days");
  const data = await tmdbFetch<{ genres: TmdbGenre[] }>(`/genre/${type}/list`);
  return data.genres;
}

export type SortKey = "popularity" | "rating" | "year" | "title";

const SORT_BY: Record<MediaType, Record<SortKey, string>> = {
  movie: {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    year: "primary_release_date.desc",
    title: "original_title.asc",
  },
  tv: {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    year: "first_air_date.desc",
    title: "name.asc",
  },
};

export async function discoverMedia(
  type: MediaType,
  options: { page?: number; genreIds?: number[]; sort?: SortKey } = {},
): Promise<TmdbPaginated<TmdbListItem>> {
  "use cache";
  cacheLife("hours");
  const sort = options.sort ?? "popularity";
  const params: Record<string, string> = {
    page: String(options.page ?? 1),
    sort_by: SORT_BY[type][sort],
  };
  if (options.genreIds?.length) {
    params.with_genres = options.genreIds.join("|");
  }
  if (sort === "rating" || sort === "title") {
    params["vote_count.gte"] = "100";
  }
  return tmdbFetch(`/discover/${type}`, params);
}

export async function searchMedia(
  query: string,
  page = 1,
): Promise<TmdbPaginated<TmdbListItem>> {
  "use cache";
  cacheLife("hours");
  const data = await tmdbFetch<
    TmdbPaginated<TmdbListItem & { media_type?: string }>
  >("/search/multi", { query, page: String(page), include_adult: "false" });
  return {
    ...data,
    results: data.results.filter(
      (item): item is TmdbListItem =>
        item.media_type === "movie" || item.media_type === "tv",
    ),
  };
}

const DETAIL_PARAMS = {
  append_to_response: "videos,credits,recommendations,watch/providers",
  include_video_language: "fr,en,null",
};

export async function getMovieDetails(
  id: number,
): Promise<TmdbMovieDetails | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await tmdbFetch<TmdbMovieDetails>(`/movie/${id}`, DETAIL_PARAMS);
  } catch (error) {
    if (error instanceof TmdbNotFoundError) return null;
    throw error;
  }
}

export async function getTvDetails(id: number): Promise<TmdbTvDetails | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await tmdbFetch<TmdbTvDetails>(`/tv/${id}`, DETAIL_PARAMS);
  } catch (error) {
    if (error instanceof TmdbNotFoundError) return null;
    throw error;
  }
}
