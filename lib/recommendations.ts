import type { Locale } from "./i18n/locales";
import { toMedia } from "./media";
import { getRecentProgress } from "./progress";
import {
  discoverMedia,
  getMediaGenreIds,
  getMovieDetails,
  getTvDetails,
} from "./tmdb";
import type { Media, MediaType } from "./types";
import { getWatchlist } from "./watchlist";

export interface SeedRecommendations {
  seed: Media;
  items: Media[];
}

/** Nombre de titres récents examinés pour deviner les goûts du compte. */
const SIGNAL_LIMIT = 8;

const TOP_GENRES = 3;

const ROW_LIMIT = 20;

interface Signal {
  mediaType: MediaType;
  tmdbId: number;
}

function mediaKey(mediaType: MediaType, tmdbId: number): string {
  return `${mediaType}:${tmdbId}`;
}

/** Titres lancés puis mis en favori, du plus récent au plus ancien, dédupliqués. */
async function collectSignals(userId: string): Promise<Signal[]> {
  const [progress, watchlist] = await Promise.all([
    getRecentProgress(userId),
    getWatchlist(userId),
  ]);

  const seen = new Set<string>();
  const signals: Signal[] = [];

  for (const entry of [...progress, ...watchlist]) {
    const key = mediaKey(entry.mediaType, entry.tmdbId);
    if (seen.has(key)) continue;
    seen.add(key);
    signals.push({ mediaType: entry.mediaType, tmdbId: entry.tmdbId });
  }

  return signals;
}

/**
 * « Parce que vous avez regardé X » : recommandations TMDB du dernier titre lancé.
 */
export async function getBecauseYouWatched(
  locale: Locale,
  userId: string,
): Promise<SeedRecommendations | null> {
  const [latest] = await getRecentProgress(userId);
  if (!latest) return null;

  if (latest.mediaType === "movie") {
    const details = await getMovieDetails(locale, latest.tmdbId);
    if (!details) return null;
    return {
      seed: toMedia(details, "movie"),
      items: details.recommendations.results
        .filter((item) => item.poster_path)
        .slice(0, ROW_LIMIT)
        .map((item) => toMedia(item, "movie")),
    };
  }

  const details = await getTvDetails(locale, latest.tmdbId);
  if (!details) return null;
  return {
    seed: toMedia(details, "tv"),
    items: details.recommendations.results
      .filter((item) => item.poster_path)
      .slice(0, ROW_LIMIT)
      .map((item) => toMedia(item, "tv")),
  };
}

/**
 * « Pour vous » : découverte filtrée sur les genres les plus fréquents de
 * l'historique, en excluant les titres déjà vus ou déjà en favoris.
 */
export async function getForYou(
  locale: Locale,
  userId: string,
): Promise<Media[]> {
  const signals = (await collectSignals(userId)).slice(0, SIGNAL_LIMIT);
  if (signals.length === 0) return [];

  // Les identifiants de genres TMDB diffèrent entre films et séries : on ne
  // compte que les signaux du type dominant pour rester cohérent.
  const movies = signals.filter(
    (signal) => signal.mediaType === "movie",
  ).length;
  const type: MediaType = movies >= signals.length / 2 ? "movie" : "tv";

  const genreLists = await Promise.all(
    signals
      .filter((signal) => signal.mediaType === type)
      .map((signal) => getMediaGenreIds(locale, type, signal.tmdbId)),
  );

  const counts = new Map<number, number>();
  for (const genres of genreLists) {
    for (const id of genres) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return [];

  const genreIds = [...counts.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, TOP_GENRES)
    .map(([id]) => id);

  const data = await discoverMedia(locale, type, {
    genreIds,
    sort: "popularity",
  });

  const known = new Set(
    signals.map((signal) => mediaKey(signal.mediaType, signal.tmdbId)),
  );

  return data.results
    .filter((item) => item.poster_path && !known.has(mediaKey(type, item.id)))
    .slice(0, ROW_LIMIT)
    .map((item) => toMedia(item, type));
}
