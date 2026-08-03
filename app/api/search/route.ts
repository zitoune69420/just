import { toMedia } from "@/lib/media";
import { getAcclaimedMovies, isTmdbConfigured, searchMedia } from "@/lib/tmdb";
import type { Media } from "@/lib/types";

const LIMIT = 8;

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
  const query =
    new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";

  if (!isTmdbConfigured()) {
    return Response.json({ results: [] });
  }

  if (query.length === 0) {
    const data = await getAcclaimedMovies();
    const results = data.results
      .filter((item) => item.poster_path)
      .slice(0, SUGGESTIONS)
      .map((item) => toHit(toMedia(item, "movie")));
    return Response.json({ results });
  }

  if (query.length < 2) {
    return Response.json({ results: [] });
  }

  const data = await searchMedia(query);
  const results = data.results
    .slice(0, LIMIT)
    .map((item) => toHit(toMedia(item)));

  return Response.json({ results });
}
