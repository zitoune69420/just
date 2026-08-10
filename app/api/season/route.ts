import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { toEpisode } from "@/lib/media";
import { getTvSeason, isTmdbConfigured } from "@/lib/tmdb";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const tvId = Number(params.get("tv"));
  const season = Number(params.get("season"));

  if (
    !isTmdbConfigured() ||
    !Number.isInteger(tvId) ||
    tvId < 1 ||
    !Number.isInteger(season) ||
    season < 0
  ) {
    return Response.json({ episodes: [] });
  }

  const { locale, t } = await getLocaleAndTranslator();
  const data = await getTvSeason(locale, tvId, season);

  return Response.json({
    episodes: (data?.episodes ?? []).map((episode) =>
      toEpisode(episode, { locale, t }),
    ),
  });
}
