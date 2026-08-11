"use server";

import { getSession } from "./auth";
import {
  isCollectionKind,
  isMediaType,
  isTmdbId,
  type CollectionKind,
} from "./collections";
import { isSupabaseAdminConfigured } from "./supabase";
import { addToCollection, removeFromCollection } from "./watchlist";
import type { MediaType } from "./types";

export type CollectionResult =
  | { ok: true; present: boolean }
  | { ok: false; reason: "unauthenticated" | "unavailable" | "invalid" };

export async function toggleCollectionItem(
  kind: CollectionKind,
  mediaType: MediaType,
  tmdbId: number,
  present: boolean,
): Promise<CollectionResult> {
  if (!isCollectionKind(kind) || !isMediaType(mediaType) || !isTmdbId(tmdbId)) {
    return { ok: false, reason: "invalid" };
  }

  const user = await getSession();
  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, reason: "unavailable" };
  }

  if (present) {
    await addToCollection(user.id, kind, tmdbId, mediaType);
  } else {
    await removeFromCollection(user.id, kind, tmdbId, mediaType);
  }

  return { ok: true, present };
}
