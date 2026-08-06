import { supabaseAdmin } from "./supabase";
import type { MediaType } from "./types";

export interface WatchlistEntry {
  tmdbId: number;
  mediaType: MediaType;
  addedAt: string;
}

interface WatchlistRow {
  tmdb_id: number;
  media_type: MediaType;
  added_at: string;
}

export async function getWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const { data, error } = await supabaseAdmin()
    .from("watchlist")
    .select("tmdb_id, media_type, added_at")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase watchlist: ${error.message}`);
  }

  return (data ?? []).map((row: WatchlistRow) => ({
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    addedAt: row.added_at,
  }));
}

export async function addToWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: MediaType,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("watchlist")
    .upsert(
      { user_id: userId, tmdb_id: tmdbId, media_type: mediaType },
      { onConflict: "user_id,tmdb_id,media_type", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error(`Supabase watchlist: ${error.message}`);
  }
}

export async function removeFromWatchlist(
  userId: string,
  tmdbId: number,
  mediaType: MediaType,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    throw new Error(`Supabase watchlist: ${error.message}`);
  }
}
