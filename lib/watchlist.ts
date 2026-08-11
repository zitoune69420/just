import { isCollectionKind, type CollectionKind } from "./collections";
import { supabaseAdmin } from "./supabase";
import type { MediaType } from "./types";

/** Les deux listes d'un compte partagent la table `watchlist`, séparées par `kind`. */
export interface CollectionEntry {
  tmdbId: number;
  mediaType: MediaType;
  addedAt: string;
}

interface CollectionRow {
  tmdb_id: number;
  media_type: MediaType;
  added_at: string;
}

export async function getCollection(
  userId: string,
  kind: CollectionKind,
): Promise<CollectionEntry[]> {
  const { data, error } = await supabaseAdmin()
    .from("watchlist")
    .select("tmdb_id, media_type, added_at")
    .eq("user_id", userId)
    .eq("kind", kind)
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase watchlist: ${error.message}`);
  }

  return (data ?? []).map((row: CollectionRow) => ({
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    addedAt: row.added_at,
  }));
}

/**
 * Les deux listes en une requête : la barre de navigation et le fournisseur
 * client les affichent ensemble, les lire séparément doublerait l'aller-retour.
 */
export async function getCollections(
  userId: string,
): Promise<Record<CollectionKind, CollectionEntry[]>> {
  const { data, error } = await supabaseAdmin()
    .from("watchlist")
    .select("tmdb_id, media_type, added_at, kind")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase watchlist: ${error.message}`);
  }

  const result: Record<CollectionKind, CollectionEntry[]> = {
    favorite: [],
    watchlist: [],
  };

  for (const row of (data ?? []) as (CollectionRow & { kind: string })[]) {
    if (!isCollectionKind(row.kind)) continue;
    result[row.kind].push({
      tmdbId: row.tmdb_id,
      mediaType: row.media_type,
      addedAt: row.added_at,
    });
  }

  return result;
}

export async function addToCollection(
  userId: string,
  kind: CollectionKind,
  tmdbId: number,
  mediaType: MediaType,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("watchlist")
    .upsert(
      { user_id: userId, tmdb_id: tmdbId, media_type: mediaType, kind },
      {
        onConflict: "user_id,tmdb_id,media_type,kind",
        ignoreDuplicates: true,
      },
    );

  if (error) {
    throw new Error(`Supabase watchlist: ${error.message}`);
  }
}

export async function removeFromCollection(
  userId: string,
  kind: CollectionKind,
  tmdbId: number,
  mediaType: MediaType,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("kind", kind)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    throw new Error(`Supabase watchlist: ${error.message}`);
  }
}
