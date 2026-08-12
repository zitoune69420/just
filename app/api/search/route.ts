import { cacheHeaders } from "@/lib/http-cache";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { allowByIp, MINUTE, tooManyRequests } from "@/lib/rate-limit";
import { toMedia } from "@/lib/media";
import { unifiedSearch } from "@/lib/search";
import { getAcclaimedMovies, isTmdbConfigured } from "@/lib/tmdb";
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
    return Response.json({ results: [], people: [], corrected: null });
  }

  const { locale, t } = await getLocaleAndTranslator();

  if (query.length === 0) {
    const data = await getAcclaimedMovies(locale);
    const results = data.results
      .filter((item) => item.poster_path)
      .slice(0, SUGGESTIONS)
      .map((item) => toHit(toMedia(item, "movie")));
    return Response.json({ results, people: [], corrected: null });
  }

  if (query.length < 2) {
    return Response.json({ results: [], people: [], corrected: null });
  }

  /**
   * Le menu de commande garde ses deux colonnes, mais elles sont désormais
   * découpées dans une liste unique déjà classée : un acteur très pertinent
   * remonte au lieu d'être noyé sous huit titres approximatifs.
   */
  const { hits, corrected } = await unifiedSearch(locale, t, query);

  const results = hits
    .filter((hit) => hit.kind === "media")
    .slice(0, LIMIT)
    .map((hit) => toHit(hit.media));

  const people = hits
    .filter((hit) => hit.kind === "person")
    .slice(0, PEOPLE_LIMIT)
    .map((hit) => hit.person);

  /**
   * Court, mais suffisant : le menu de commande rappelle la route à chaque
   * frappe, et effacer une lettre redemande une requête déjà posée une seconde
   * plus tôt.
   */
  return Response.json(
    { results, people, corrected },
    { headers: cacheHeaders(60) },
  );
}
