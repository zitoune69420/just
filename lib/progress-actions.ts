"use server";

import { isMediaType, isTmdbId } from "./collections";
import { clearAllProgress, clearProgress, saveProgress } from "./progress";
import { getSession } from "./auth";
import { isSupabaseAdminConfigured } from "./supabase";
import type { MediaType } from "./types";

function episodeNumber(value: number | null): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

export async function recordProgress(
  mediaType: MediaType,
  tmdbId: number,
  season: number | null = null,
  episode: number | null = null,
): Promise<void> {
  if (!isMediaType(mediaType) || !isTmdbId(tmdbId)) return;
  if (!isSupabaseAdminConfigured()) return;

  const user = await getSession();
  if (!user) return;

  try {
    await saveProgress(user.id, {
      tmdbId,
      mediaType,
      season: mediaType === "tv" ? episodeNumber(season) : null,
      episode: mediaType === "tv" ? episodeNumber(episode) : null,
    });
  } catch {
    return;
  }
}

export async function forgetProgress(
  mediaType: MediaType,
  tmdbId: number,
): Promise<void> {
  if (!isMediaType(mediaType) || !isTmdbId(tmdbId)) return;
  if (!isSupabaseAdminConfigured()) return;

  const user = await getSession();
  if (!user) return;

  try {
    await clearProgress(user.id, mediaType, tmdbId);
  } catch {
    return;
  }
}

/**
 * Vide l'historique entier. La confirmation est à la charge de l'appelant :
 * cette action ne se rejoue pas.
 */
export async function forgetAllProgress(): Promise<{ ok: boolean }> {
  if (!isSupabaseAdminConfigured()) return { ok: false };

  const user = await getSession();
  if (!user) return { ok: false };

  try {
    await clearAllProgress(user.id);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
