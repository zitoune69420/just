import { cacheLife } from "next/cache";
import { TMDB_LANGUAGE, type Locale } from "./i18n/locales";
import type {
  MediaType,
  TmdbAiringEpisode,
  TmdbGenre,
  TmdbListItem,
  TmdbMovieDetails,
  TmdbMovieListItem,
  TmdbPaginated,
  TmdbPersonDetails,
  TmdbPersonListItem,
  TmdbSeasonDetails,
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
  locale: Locale,
  params: Record<string, string> = {},
): Promise<T> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TMDB_API_KEY manquante. Ajoutez-la dans .env.local (voir .env.example).",
    );
  }

  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("language", TMDB_LANGUAGE[locale]);
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

export async function getTrending(locale: Locale): Promise<TmdbListItem[]> {
  "use cache";
  cacheLife("hours");
  const data = await tmdbFetch<
    TmdbPaginated<TmdbListItem & { media_type?: string }>
  >("/trending/all/week", locale);
  return data.results.filter(
    (item): item is TmdbListItem =>
      item.media_type === "movie" || item.media_type === "tv",
  );
}

export async function getPopularMovies(
  locale: Locale,
  page = 1,
): Promise<TmdbPaginated<TmdbMovieListItem>> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/movie/popular", locale, { page: String(page) });
}

export async function getPopularTv(
  locale: Locale,
  page = 1,
): Promise<TmdbPaginated<TmdbTvListItem>> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/tv/popular", locale, { page: String(page) });
}

export async function getTopRatedMovies(
  locale: Locale,
): Promise<TmdbPaginated<TmdbMovieListItem>> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/movie/top_rated", locale);
}

export async function getAcclaimedMovies(
  locale: Locale,
): Promise<TmdbPaginated<TmdbMovieListItem>> {
  "use cache";
  cacheLife("days");
  return tmdbFetch("/discover/movie", locale, {
    sort_by: "vote_average.desc",
    "vote_count.gte": "5000",
  });
}

const RELEASE_REGION = "FR";

/**
 * `/movie/upcoming` renvoie aussi des titres déjà sortis selon la région : on
 * ne garde que ceux dont la date est encore devant nous. Le filtre est dans la
 * portée mise en cache, donc réévalué au rythme de `cacheLife("hours")`.
 */
export async function getUpcomingMovies(
  locale: Locale,
): Promise<TmdbPaginated<TmdbMovieListItem>> {
  "use cache";
  cacheLife("hours");
  const data = await tmdbFetch<TmdbPaginated<TmdbMovieListItem>>(
    "/movie/upcoming",
    locale,
    { region: RELEASE_REGION },
  );

  const today = new Date().toISOString().slice(0, 10);
  const results = data.results.filter(
    (item) => (item.release_date ?? "") > today,
  );

  return { ...data, results, total_results: results.length };
}

export async function getNowPlayingMovies(
  locale: Locale,
): Promise<TmdbPaginated<TmdbMovieListItem>> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/movie/now_playing", locale, { region: RELEASE_REGION });
}

export async function getOnTheAirTv(
  locale: Locale,
): Promise<TmdbPaginated<TmdbTvListItem>> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/tv/on_the_air", locale);
}

export async function getAiringTodayTv(
  locale: Locale,
): Promise<TmdbPaginated<TmdbTvListItem>> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/tv/airing_today", locale);
}

export async function getGenres(
  locale: Locale,
  type: MediaType,
): Promise<TmdbGenre[]> {
  "use cache";
  cacheLife("days");
  const data = await tmdbFetch<{ genres: TmdbGenre[] }>(
    `/genre/${type}/list`,
    locale,
  );
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
  locale: Locale,
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
  return tmdbFetch(`/discover/${type}`, locale, params);
}

export async function searchMedia(
  locale: Locale,
  query: string,
  page = 1,
): Promise<TmdbPaginated<TmdbListItem>> {
  "use cache";
  cacheLife("hours");
  const data = await tmdbFetch<
    TmdbPaginated<TmdbListItem & { media_type?: string }>
  >("/search/multi", locale, { query, page: String(page), include_adult: "false" });
  return {
    ...data,
    results: data.results.filter(
      (item): item is TmdbListItem =>
        item.media_type === "movie" || item.media_type === "tv",
    ),
  };
}

export async function searchPeople(
  locale: Locale,
  query: string,
  page = 1,
): Promise<TmdbPaginated<TmdbPersonListItem>> {
  "use cache";
  cacheLife("hours");
  return tmdbFetch("/search/person", locale, {
    query,
    page: String(page),
    include_adult: "false",
  });
}

export async function getPersonDetails(
  locale: Locale,
  id: number,
): Promise<TmdbPersonDetails | null> {
  "use cache";
  cacheLife("days");
  try {
    return await tmdbFetch<TmdbPersonDetails>(`/person/${id}`, locale, {
      append_to_response: "combined_credits",
    });
  } catch (error) {
    if (error instanceof TmdbNotFoundError) return null;
    throw error;
  }
}

/** Identifiants de genres d'un titre, pour dériver les goûts d'un compte. */
export async function getMediaGenreIds(
  locale: Locale,
  type: MediaType,
  id: number,
): Promise<number[]> {
  "use cache";
  cacheLife("days");
  try {
    const data = await tmdbFetch<{ genres?: TmdbGenre[] }>(
      `/${type}/${id}`,
      locale,
    );
    return (data.genres ?? []).map((genre) => genre.id);
  } catch (error) {
    if (error instanceof TmdbNotFoundError) return [];
    throw error;
  }
}

export async function getNextEpisode(
  locale: Locale,
  id: number,
): Promise<TmdbAiringEpisode | null> {
  "use cache";
  cacheLife("hours");
  try {
    const data = await tmdbFetch<TmdbTvDetails>(`/tv/${id}`, locale);
    return data.next_episode_to_air ?? null;
  } catch (error) {
    if (error instanceof TmdbNotFoundError) return null;
    throw error;
  }
}

/** Bandes-annonces : on accepte la langue courante, l'anglais, puis sans langue. */
function detailParams(locale: Locale): Record<string, string> {
  return {
    append_to_response: "videos,credits,recommendations,watch/providers",
    include_video_language: `${locale},en,null`,
  };
}

export async function getMovieDetails(
  locale: Locale,
  id: number,
): Promise<TmdbMovieDetails | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await tmdbFetch<TmdbMovieDetails>(
      `/movie/${id}`,
      locale,
      detailParams(locale),
    );
  } catch (error) {
    if (error instanceof TmdbNotFoundError) return null;
    throw error;
  }
}

export async function getMediaSummary(
  locale: Locale,
  type: MediaType,
  id: number,
): Promise<TmdbListItem | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await tmdbFetch<TmdbListItem>(`/${type}/${id}`, locale);
  } catch (error) {
    if (error instanceof TmdbNotFoundError) return null;
    throw error;
  }
}

export async function getTvSeason(
  locale: Locale,
  id: number,
  season: number,
): Promise<TmdbSeasonDetails | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await tmdbFetch<TmdbSeasonDetails>(
      `/tv/${id}/season/${season}`,
      locale,
    );
  } catch (error) {
    if (error instanceof TmdbNotFoundError) return null;
    throw error;
  }
}

export async function getTvDetails(
  locale: Locale,
  id: number,
): Promise<TmdbTvDetails | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await tmdbFetch<TmdbTvDetails>(`/tv/${id}`, locale, detailParams(locale));
  } catch (error) {
    if (error instanceof TmdbNotFoundError) return null;
    throw error;
  }
}
