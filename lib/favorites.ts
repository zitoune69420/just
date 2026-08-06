import type { MediaType } from "./types";

export const FAVORITES_ENDPOINT = "/api/favorites";

export interface FavoritesPayload {
  signedIn: boolean;
  keys: string[];
}

export function favoriteKey(mediaType: MediaType, tmdbId: number): string {
  return `${mediaType}:${tmdbId}`;
}

export function isMediaType(value: unknown): value is MediaType {
  return value === "movie" || value === "tv";
}

export function isTmdbId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
