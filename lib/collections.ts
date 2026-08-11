import type { MediaType } from "./types";

/**
 * Aides partagées par le serveur et le client. Ce module ne doit dépendre de
 * rien qui touche Supabase : il part dans le bundle navigateur.
 *
 * Les deux listes d'un compte : `favorite` est le cœur d'une fiche, `watchlist`
 * est la file « à voir plus tard ». Un titre peut être dans les deux.
 */
export type CollectionKind = "favorite" | "watchlist";

export const COLLECTION_KINDS: readonly CollectionKind[] = [
  "favorite",
  "watchlist",
];

export const COLLECTIONS_ENDPOINT = "/api/collections";

export interface CollectionsPayload {
  signedIn: boolean;
  keys: Record<CollectionKind, string[]>;
}

export function collectionItemKey(
  mediaType: MediaType,
  tmdbId: number,
): string {
  return `${mediaType}:${tmdbId}`;
}

export function isCollectionKind(value: unknown): value is CollectionKind {
  return value === "favorite" || value === "watchlist";
}

export function isMediaType(value: unknown): value is MediaType {
  return value === "movie" || value === "tv";
}

export function isTmdbId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}
