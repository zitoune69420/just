import { readCache, writeCache } from "./client-cache";
import type { Episode, Season } from "./types";

export interface NextEpisode {
  season: number;
  episode: number;
  label: string;
  runtime: number | null;
}

export function seasonCacheKey(tvId: number, season: number): string {
  return `season:${tvId}:${season}`;
}

/**
 * Une saison entièrement diffusée ne bouge plus : c'est la seule qu'on garde.
 *
 * `released` est calculé au rendu à partir de la date de diffusion. Mettre en
 * cache une saison en cours figerait ce calcul pendant des jours — l'épisode de
 * la semaine resterait affiché comme non sorti, et injouable.
 */
function cacheable(episodes: Episode[]): boolean {
  return episodes.length > 0 && episodes.every((episode) => episode.released);
}

/** Charge les épisodes d'une saison via la route interne. Tableau vide si échec. */
export async function fetchSeasonEpisodes(
  tvId: number,
  season: number,
  signal?: AbortSignal,
): Promise<Episode[]> {
  const key = seasonCacheKey(tvId, season);
  const cached = readCache<Episode[]>(key);
  if (cached) return cached;

  try {
    const response = await fetch(`/api/season?tv=${tvId}&season=${season}`, {
      signal,
    });
    const data = (await response.json()) as { episodes?: Episode[] };
    const episodes = data.episodes ?? [];

    if (response.ok && cacheable(episodes)) writeCache(key, episodes);

    return episodes;
  } catch {
    return [];
  }
}

/**
 * Épisode qui suit `episode` dans `season` : le suivant de la même saison,
 * sinon le premier épisode de la saison d'après.
 */
export function nextEpisodeAfter(
  seasons: Season[],
  season: number,
  episode: number,
  episodes: Episode[],
): NextEpisode | null {
  const inSameSeason = episodes.find((item) => item.number === episode + 1);
  if (inSameSeason && !inSameSeason.released) return null;
  if (inSameSeason) {
    return {
      season,
      episode: inSameSeason.number,
      label: `S${season} E${inSameSeason.number} · ${inSameSeason.title}`,
      runtime: inSameSeason.runtime,
    };
  }

  const following = seasons.find((item) => item.number > season);
  if (following) {
    return {
      season: following.number,
      episode: 1,
      label: `S${following.number} E1`,
      runtime: null,
    };
  }

  return null;
}
