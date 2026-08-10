import type { Locale } from "./i18n/locales";
import { getMediaSummary, getNextEpisode } from "./tmdb";
import type { UpcomingEpisode } from "./types";
import { getWatchlist } from "./watchlist";

/** Séries suivies interrogées pour leur prochain épisode. */
const SERIES_LIMIT = 12;

/**
 * Prochains épisodes annoncés pour les séries en favoris, du plus proche au
 * plus lointain. Les séries sans date annoncée sont ignorées.
 */
export async function getUpcomingEpisodes(
  locale: Locale,
  userId: string,
): Promise<UpcomingEpisode[]> {
  const series = (await getWatchlist(userId))
    .filter((entry) => entry.mediaType === "tv")
    .slice(0, SERIES_LIMIT);

  if (series.length === 0) return [];

  const results = await Promise.all(
    series.map(async (entry) => {
      const [next, summary] = await Promise.all([
        getNextEpisode(locale, entry.tmdbId),
        getMediaSummary(locale, "tv", entry.tmdbId),
      ]);

      if (!next?.air_date || !summary || !("name" in summary)) return null;

      return {
        tmdbId: entry.tmdbId,
        series: summary.name,
        poster: summary.poster_path,
        season: next.season_number,
        episode: next.episode_number,
        title: next.name,
        airDate: next.air_date,
      } satisfies UpcomingEpisode;
    }),
  );

  return results
    .filter((entry): entry is UpcomingEpisode => entry !== null)
    .toSorted((a, b) => a.airDate.localeCompare(b.airDate));
}
