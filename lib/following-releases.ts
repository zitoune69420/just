import { getFollowedPeople } from "./follows";
import type { Locale } from "./i18n/locales";
import { getPersonDetails } from "./tmdb";
import type { Media, MediaType, TmdbPersonCredit } from "./types";

/** Personnes interrogées : au-delà, la rangée coûte plus qu'elle ne rapporte. */
const PEOPLE_LIMIT = 8;

const ROW_LIMIT = 20;

const DAY_MS = 86_400_000;

/** Fenêtre autour d'aujourd'hui : six mois en arrière, un an devant. */
const PAST_DAYS = 180;

const FUTURE_DAYS = 365;

function creditDate(credit: TmdbPersonCredit): string | null {
  return credit.release_date || credit.first_air_date || null;
}

/**
 * Sorties récentes et annoncées des personnes suivies, de la plus proche
 * d'aujourd'hui à la plus lointaine — une sortie de la semaine prochaine et une
 * de la semaine dernière comptent autant l'une que l'autre.
 *
 * Un même titre peut réunir plusieurs personnes suivies : il n'apparaît qu'une
 * fois, avec le rôle du premier crédit rencontré.
 */
export async function getFollowedReleases(
  locale: Locale,
  userId: string,
): Promise<Media[]> {
  const follows = (await getFollowedPeople(userId)).slice(0, PEOPLE_LIMIT);
  if (follows.length === 0) return [];

  const people = await Promise.all(
    follows.map((follow) => getPersonDetails(locale, follow.personId)),
  );

  const now = Date.now();
  const oldest = now - PAST_DAYS * DAY_MS;
  const newest = now + FUTURE_DAYS * DAY_MS;

  const seen = new Set<string>();
  const found: { media: Media; distance: number }[] = [];

  for (const person of people) {
    if (!person) continue;

    const credits = [
      ...(person.combined_credits?.cast ?? []),
      ...(person.combined_credits?.crew ?? []),
    ];

    for (const credit of credits) {
      const date = creditDate(credit);
      if (!date || !credit.poster_path) continue;

      const time = Date.parse(date);
      if (Number.isNaN(time) || time < oldest || time > newest) continue;

      const type: MediaType = credit.media_type;
      const key = `${type}:${credit.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const title = credit.title ?? credit.name;
      if (!title) continue;

      found.push({
        media: {
          id: credit.id,
          type,
          title,
          year: date.slice(0, 4),
          overview: credit.overview,
          poster: credit.poster_path,
          backdrop: credit.backdrop_path,
          rating: credit.vote_average,
          votes: credit.vote_count,
          // La rangée existe à cause de cette personne : on dit laquelle.
          role: credit.character || credit.job || person.name,
        },
        distance: Math.abs(time - now),
      });
    }
  }

  return found
    .toSorted((a, b) => a.distance - b.distance)
    .slice(0, ROW_LIMIT)
    .map((entry) => entry.media);
}
