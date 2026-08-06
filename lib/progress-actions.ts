"use server";

import { isMediaType, isTmdbId } from "./favorites";
import { clearProgress, saveProgress } from "./progress";
import { getSession } from "./session";
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
