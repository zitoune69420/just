import type {
  Media,
  MediaDetails,
  MediaType,
  TmdbCastMember,
  TmdbListItem,
  TmdbMovieDetails,
  TmdbTvDetails,
  TmdbVideo,
} from "./types";

const IMAGE_BASE = "https://image.tmdb.org/t/p";

type TmdbImageSize = "w185" | "w342" | "w500" | "w780" | "w1280" | "original";

export function tmdbImage(path: string, size: TmdbImageSize): string {
  return `${IMAGE_BASE}/${size}${path}`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

function formatDate(date: string | undefined): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : DATE_FORMATTER.format(parsed);
}

function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining} min`;
  return `${hours} h ${String(remaining).padStart(2, "0")}`;
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count > 1 ? "s" : ""}`;
}

export function toMedia(item: TmdbListItem, fallbackType?: MediaType): Media {
  const isMovie = "title" in item;
  const date = isMovie ? item.release_date : item.first_air_date;
  return {
    id: item.id,
    type: item.media_type ?? fallbackType ?? (isMovie ? "movie" : "tv"),
    title: isMovie ? item.title : item.name,
    year: date ? date.slice(0, 4) : null,
    overview: item.overview,
    poster: item.poster_path,
    backdrop: item.backdrop_path,
    rating: item.vote_average,
    votes: item.vote_count,
  };
}

/** Bande-annonce YouTube la plus pertinente : officielle > trailer > teaser. */
function pickTrailer(videos: TmdbVideo[]): string | null {
  const youtube = videos.filter((video) => video.site === "YouTube");
  const best =
    youtube.find((video) => video.type === "Trailer" && video.official) ??
    youtube.find((video) => video.type === "Trailer") ??
    youtube.find((video) => video.type === "Teaser") ??
    youtube[0];
  return best?.key ?? null;
}

function toCast(cast: TmdbCastMember[]) {
  return cast.slice(0, 12).map((member) => ({
    id: member.id,
    name: member.name,
    character: member.character,
    profile: member.profile_path,
  }));
}

function toRecommendations(
  items: TmdbListItem[],
  fallbackType: MediaType,
): Media[] {
  return items
    .filter((item) => item.poster_path)
    .slice(0, 12)
    .map((item) => toMedia(item, fallbackType));
}

export function toMovieDetails(details: TmdbMovieDetails): MediaDetails {
  const facts = [
    formatDate(details.release_date),
    formatRuntime(details.runtime),
  ].filter((fact): fact is string => fact !== null);

  return {
    ...toMedia(details, "movie"),
    genres: details.genres,
    tagline: details.tagline || null,
    facts,
    trailerKey: pickTrailer(details.videos.results),
    cast: toCast(details.credits.cast),
    recommendations: toRecommendations(details.recommendations.results, "movie"),
  };
}

export function toTvDetails(details: TmdbTvDetails): MediaDetails {
  const facts = [
    formatDate(details.first_air_date),
    details.number_of_seasons > 0
      ? plural(details.number_of_seasons, "saison")
      : null,
    details.number_of_episodes > 0
      ? plural(details.number_of_episodes, "épisode")
      : null,
  ].filter((fact): fact is string => fact !== null);

  return {
    ...toMedia(details, "tv"),
    genres: details.genres,
    tagline: details.tagline || null,
    facts,
    trailerKey: pickTrailer(details.videos.results),
    cast: toCast(details.credits.cast),
    recommendations: toRecommendations(details.recommendations.results, "tv"),
  };
}
