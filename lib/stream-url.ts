import type { MediaType } from "./types";

function base(): string | null {
  const value =
    process.env.STREAM_BASE_URL || process.env.NEXT_PUBLIC_STREAM_BASE_URL;
  return value ? value.replace(/\/+$/, "") : null;
}

export function isStreamConfigured(): boolean {
  return base() !== null;
}

export function buildStreamUrl(
  mediaType: MediaType,
  tmdbId: number,
  season: number | null,
  episode: number | null,
): string | null {
  const root = base();
  if (!root) return null;

  if (mediaType === "tv" && season !== null && episode !== null) {
    return `${root}/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
  }
  if (mediaType === "tv") return null;

  return `${root}/movie?tmdb=${tmdbId}`;
}
