import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { allowByIp, MINUTE, tooManyRequests } from "@/lib/rate-limit";
import { toMedia, toPerson } from "@/lib/media";
import {
  getAcclaimedMovies,
  isTmdbConfigured,
  searchMedia,
  searchPeople,
} from "@/lib/tmdb";
import type { Media } from "@/lib/types";

const QUOTA = { limit: 30, windowMs: MINUTE };

const LIMIT = 8;

const PEOPLE_LIMIT = 3;

const SUGGESTIONS = 3;

function toHit(media: Media) {
  return {
    id: media.id,
    type: media.type,
    title: media.title,
    year: media.year,
    poster: media.poster,
  };
}

export async function GET(request: Request) {
  /** Route publique adossée à une clé TMDB facturée : on borne les appels. */
  if (!(await allowByIp("search", QUOTA))) return tooManyRequests(MINUTE);

  const query =
    new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";

  if (!isTmdbConfigured()) {
    return Response.json({ results: [], people: [] });
  }

  const { locale, t } = await getLocaleAndTranslator();

  if (query.length === 0) {
    const data = await getAcclaimedMovies(locale);
    const results = data.results
      .filter((item) => item.poster_path)
      .slice(0, SUGGESTIONS)
      .map((item) => toHit(toMedia(item, "movie")));
    return Response.json({ results, people: [] });
  }

  if (query.length < 2) {
    return Response.json({ results: [], people: [] });
  }

  const [data, peopleData] = await Promise.all([
    searchMedia(locale, query),
    searchPeople(locale, query),
  ]);

  const results = data.results
    .slice(0, LIMIT)
    .map((item) => toHit(toMedia(item)));

  const people = peopleData.results
    .filter((item) => item.profile_path)
    .slice(0, PEOPLE_LIMIT)
    .map((item) => toPerson(item, t));

  return Response.json({ results, people });
}
