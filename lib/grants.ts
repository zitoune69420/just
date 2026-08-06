import { supabaseAdmin } from "./supabase";
import type { MediaType } from "./types";

export const PERMANENT_PERIOD = "";

export function currentPeriod(now = new Date()): string {
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

export function periodFor(mediaType: MediaType): string {
  return mediaType === "movie" ? currentPeriod() : PERMANENT_PERIOD;
}

export async function hasGrant(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
  period: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("grants")
    .select("id")
    .eq("user_id", userId)
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId)
    .eq("period", period)
    .maybeSingle<{ id: number }>();

  if (error) {
    throw new Error(`Supabase grants: ${error.message}`);
  }
  return data !== null;
}

export async function countGrants(
  userId: string,
  mediaType: MediaType,
  period?: string,
): Promise<number> {
  let query = supabaseAdmin()
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("media_type", mediaType);

  if (period !== undefined) {
    query = query.eq("period", period);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(`Supabase grants: ${error.message}`);
  }
  return count ?? 0;
}

export async function addGrant(
  userId: string,
  mediaType: MediaType,
  tmdbId: number,
  period: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("grants")
    .upsert(
      { user_id: userId, media_type: mediaType, tmdb_id: tmdbId, period },
      {
        onConflict: "user_id,media_type,tmdb_id,period",
        ignoreDuplicates: true,
      },
    );

  if (error) {
    throw new Error(`Supabase grants: ${error.message}`);
  }
}
