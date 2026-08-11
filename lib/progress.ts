import { supabaseAdmin } from "./supabase";
import type { MediaType } from "./types";

export interface ProgressEntry {
  tmdbId: number;
  mediaType: MediaType;
  season: number | null;
  episode: number | null;
  positionSeconds: number;
  durationSeconds: number | null;
  updatedAt: string;
}

interface ProgressRow {
  tmdb_id: number;
  media_type: MediaType;
  season: number | null;
  episode: number | null;
  position_seconds: number;
  duration_seconds: number | null;
  updated_at: string;
}

const COLUMNS =
  "tmdb_id, media_type, season, episode, position_seconds, duration_seconds, updated_at";

const RECENT_LIMIT = 20;

/** Page d'historique : assez pour remplir un écran sans tout charger. */
export const HISTORY_PAGE_SIZE = 40;

function toEntry(row: ProgressRow): ProgressEntry {
  return {
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    season: row.season,
    episode: row.episode,
    positionSeconds: row.position_seconds,
    durationSeconds: row.duration_seconds,
    updatedAt: row.updated_at,
  };
}

export async function getRecentProgress(
  userId: string,
): Promise<ProgressEntry[]> {
  const { data, error } = await supabaseAdmin()
    .from("progress")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(RECENT_LIMIT);

  if (error) {
    throw new Error(`Supabase progress: ${error.message}`);
  }

  return (data ?? []).map((row: ProgressRow) => toEntry(row));
}

/**
 * Historique complet, paginé. `hasMore` évite un `count` séparé : on demande
 * une ligne de plus que la page et on la jette.
 */
export async function getProgressHistory(
  userId: string,
  page: number,
): Promise<{ entries: ProgressEntry[]; hasMore: boolean }> {
  const from = page * HISTORY_PAGE_SIZE;

  const { data, error } = await supabaseAdmin()
    .from("progress")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .range(from, from + HISTORY_PAGE_SIZE);

  if (error) {
    throw new Error(`Supabase progress: ${error.message}`);
  }

  const rows = (data ?? []) as ProgressRow[];
  return {
    entries: rows.slice(0, HISTORY_PAGE_SIZE).map(toEntry),
    hasMore: rows.length > HISTORY_PAGE_SIZE,
  };
}

export async function getProgressFor(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
): Promise<ProgressEntry | null> {
  const { data, error } = await supabaseAdmin()
    .from("progress")
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId)
    .maybeSingle<ProgressRow>();

  if (error) {
    throw new Error(`Supabase progress: ${error.message}`);
  }

  return data ? toEntry(data) : null;
}

export async function saveProgress(
  userId: string,
  input: {
    tmdbId: number;
    mediaType: MediaType;
    season: number | null;
    episode: number | null;
  },
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("progress")
    .upsert(
      {
        user_id: userId,
        tmdb_id: input.tmdbId,
        media_type: input.mediaType,
        season: input.season,
        episode: input.episode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tmdb_id,media_type" },
    );

  if (error) {
    throw new Error(`Supabase progress: ${error.message}`);
  }
}

export async function advanceProgress(
  userId: string,
  input: {
    tmdbId: number;
    mediaType: MediaType;
    season: number | null;
    episode: number | null;
    seconds: number;
    durationSeconds: number | null;
  },
): Promise<void> {
  const { error } = await supabaseAdmin().rpc("advance_progress", {
    p_user_id: userId,
    p_tmdb_id: input.tmdbId,
    p_media_type: input.mediaType,
    p_season: input.season,
    p_episode: input.episode,
    p_seconds: input.seconds,
    p_duration: input.durationSeconds,
  });

  if (error) {
    throw new Error(`Supabase progress: ${error.message}`);
  }
}

export async function clearProgress(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("progress")
    .delete()
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId);

  if (error) {
    throw new Error(`Supabase progress: ${error.message}`);
  }
}

/** Efface tout l'historique d'un compte. Irréversible : l'appelant confirme. */
export async function clearAllProgress(userId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("progress")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Supabase progress: ${error.message}`);
  }
}
