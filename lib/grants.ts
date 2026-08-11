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

export interface GrantClaim {
  allowed: boolean;
  consumed: boolean;
  used: number | null;
}

/**
 * Réserve un titre en une seule transaction : compter depuis Node puis insérer
 * laisse deux lectures simultanées passer sous la même limite. Le compteur
 * porte sur `countPeriod` (`null` = toutes périodes confondues), l'insertion
 * sur `period`.
 */
export async function claimGrant(options: {
  userId: string;
  mediaType: MediaType;
  tmdbId: number;
  period: string;
  limit: number;
  countPeriod: string | null;
}): Promise<GrantClaim> {
  const { data, error } = await supabaseAdmin().rpc("claim_grant", {
    p_user_id: options.userId,
    p_media_type: options.mediaType,
    p_tmdb_id: options.tmdbId,
    p_period: options.period,
    p_limit: options.limit,
    p_count_period: options.countPeriod,
  });

  if (error) {
    throw new Error(`Supabase claim_grant: ${error.message}`);
  }

  const row = (data as GrantClaim[] | null)?.[0];
  if (!row) {
    throw new Error("Supabase claim_grant: réponse vide");
  }
  return row;
}

