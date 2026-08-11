import type { Locale } from "./i18n/locales";
import { getMediaSummary, getNextEpisode } from "./tmdb";
import type { UpcomingEpisode } from "./types";
import { getCollections } from "./watchlist";

/** Séries suivies interrogées pour leur prochain épisode. */
const SERIES_LIMIT = 12;

/**
 * Prochains épisodes annoncés pour les séries suivies, du plus proche au plus
 * lointain. Les séries sans date annoncée sont ignorées.
 *
 * Les deux listes comptent : ranger une série dans « à voir plus tard » est un
 * suivi au même titre que l'aimer.
 */
export async function getUpcomingEpisodes(
  locale: Locale,
  userId: string,
): Promise<UpcomingEpisode[]> {
  const collections = await getCollections(userId);

  const seen = new Set<number>();
  const series: { tmdbId: number }[] = [];
  for (const entry of [...collections.favorite, ...collections.watchlist]) {
    if (entry.mediaType !== "tv" || seen.has(entry.tmdbId)) continue;
    seen.add(entry.tmdbId);
    series.push({ tmdbId: entry.tmdbId });
    if (series.length === SERIES_LIMIT) break;
  }

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
