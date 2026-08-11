import type { Locale } from "./i18n/locales";
import type { ProgressEntry } from "./progress";
import { getTvDetails, getTvSeason } from "./tmdb";

/**
 * Part de l'épisode qu'il faut avoir parcourue pour le considérer terminé et
 * proposer le suivant. En dessous, on repart là où le compte s'était arrêté.
 *
 * Le seuil est volontairement bas : le générique de fin d'une série tient
 * souvent dans les dix dernières pour cent, et personne ne veut se voir
 * reproposer un épisode qu'il a laissé au générique.
 */
const FINISHED_RATIO = 0.9;

export interface ResumeTarget {
  season: number | null;
  episode: number | null;
  /** Position de reprise, remise à zéro quand on bascule sur l'épisode suivant. */
  positionSeconds: number;
  /** Vrai quand la cible est l'épisode d'après, pas celui laissé en cours. */
  advanced: boolean;
  /** `S2 E3`, ou `null` pour un film. */
  label: string | null;
  /** Avancement du titre en cours, entre 0 et 1. Zéro sur un épisode neuf. */
  ratio: number;
}

function watchedRatio(entry: ProgressEntry): number {
  if (!entry.durationSeconds || entry.durationSeconds <= 0) return 0;
  return Math.min(entry.positionSeconds / entry.durationSeconds, 1);
}

function released(airDate: string | undefined): boolean {
  if (!airDate) return false;
  return airDate <= new Date().toISOString().slice(0, 10);
}

function label(season: number, episode: number): string {
  return `S${season} E${episode}`;
}

/**
 * Où reprendre la lecture d'un titre déjà lancé.
 *
 * Pour un film, ou pour un épisode laissé en cours, c'est l'endroit exact où le
 * compte s'était arrêté. Pour un épisode terminé, c'est le premier épisode
 * diffusé qui le suit — dans la même saison, sinon au début de la suivante.
 * Quand la série n'a plus rien de diffusé après, on reste sur le dernier
 * épisode vu plutôt que de renvoyer une cible qui n'existe pas.
 */
export async function resolveResume(
  locale: Locale,
  entry: ProgressEntry,
): Promise<ResumeTarget> {
  const ratio = watchedRatio(entry);

  const stay: ResumeTarget = {
    season: entry.season,
    episode: entry.episode,
    positionSeconds: entry.positionSeconds,
    advanced: false,
    label:
      entry.season !== null && entry.episode !== null
        ? label(entry.season, entry.episode)
        : null,
    ratio,
  };

  if (entry.mediaType !== "tv" || entry.season === null || entry.episode === null) {
    return stay;
  }

  if (ratio < FINISHED_RATIO) return stay;

  const next = await nextReleasedEpisode(locale, entry.tmdbId, entry.season, entry.episode);
  if (!next) return stay;

  return {
    season: next.season,
    episode: next.episode,
    positionSeconds: 0,
    advanced: true,
    label: label(next.season, next.episode),
    ratio: 0,
  };
}

async function nextReleasedEpisode(
  locale: Locale,
  tvId: number,
  season: number,
  episode: number,
): Promise<{ season: number; episode: number } | null> {
  const current = await getTvSeason(locale, tvId, season);
  const inSameSeason = current?.episodes.find(
    (item) => item.episode_number === episode + 1,
  );
  if (inSameSeason) {
    return released(inSameSeason.air_date)
      ? { season, episode: inSameSeason.episode_number }
      : null;
  }

  const details = await getTvDetails(locale, tvId);
  if (!details) return null;

  // Les saisons hors série principale (numéro 0) sont des bonus : on les saute.
  const following = details.seasons
    .filter((item) => item.season_number > season && item.season_number > 0)
    .toSorted((a, b) => a.season_number - b.season_number)[0];
  if (!following) return null;

  const next = await getTvSeason(locale, tvId, following.season_number);
  const first = next?.episodes.find((item) => item.episode_number === 1);
  if (!first || !released(first.air_date)) return null;

  return { season: following.season_number, episode: 1 };
}
