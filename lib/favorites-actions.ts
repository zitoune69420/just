"use server";

import { isMediaType, isTmdbId } from "./favorites";
import { getSession } from "./session";
import { isSupabaseAdminConfigured } from "./supabase";
import { addToWatchlist, removeFromWatchlist } from "./watchlist";
import type { MediaType } from "./types";

export type FavoriteResult =
  | { ok: true; favorite: boolean }
  | { ok: false; reason: "unauthenticated" | "unavailable" | "invalid" };

export async function toggleFavorite(
  mediaType: MediaType,
  tmdbId: number,
  favorite: boolean,
): Promise<FavoriteResult> {
  if (!isMediaType(mediaType) || !isTmdbId(tmdbId)) {
    return { ok: false, reason: "invalid" };
  }

  const user = await getSession();
  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, reason: "unavailable" };
  }

  if (favorite) {
    await addToWatchlist(user.id, tmdbId, mediaType);
  } else {
    await removeFromWatchlist(user.id, tmdbId, mediaType);
  }

  return { ok: true, favorite };
}
