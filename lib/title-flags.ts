import { supabaseAdmin } from "./supabase";
import type { MediaType } from "./types";

/**
 * État d'un titre décidé par l'administration, indépendant des signalements.
 *
 * Un signalement dit qu'un compte a rencontré un problème ; ce drapeau dit que
 * l'administration l'a confirmé. C'est lui, et lui seul, qui déclenche
 * l'avertissement affiché aux comptes.
 */
export interface TitleKey {
  mediaType: MediaType;
  tmdbId: number;
}

function keyOf(mediaType: MediaType, tmdbId: number): string {
  return `${mediaType}:${tmdbId}`;
}

/**
 * Renvoie `false` plutôt que de propager l'erreur : un drapeau illisible ne doit
 * pas empêcher d'afficher la fiche. Au pire l'avertissement manque.
 */
export async function isTitleUnavailable(
  mediaType: MediaType,
  tmdbId: number,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("title_flags")
    .select("unavailable")
    .eq("media_type", mediaType)
    .eq("tmdb_id", tmdbId)
    .maybeSingle();

  if (error) {
    console.error("[title-flags] Lecture impossible", error);
    return false;
  }

  return data?.unavailable ?? false;
}

/**
 * Version groupée pour le tableau d'administration : une requête au lieu d'une
 * par ligne. Les titres absents de la table ne sont pas marqués.
 */
export async function getUnavailableTitles(
  titles: TitleKey[],
): Promise<ReadonlySet<string>> {
  if (titles.length === 0) return new Set();

  const { data, error } = await supabaseAdmin()
    .from("title_flags")
    .select("tmdb_id, media_type")
    .eq("unavailable", true)
    .in(
      "tmdb_id",
      titles.map((title) => title.tmdbId),
    );

  if (error) {
    console.error("[title-flags] Lecture groupée impossible", error);
    return new Set();
  }

  /**
   * Le filtre `in` ne porte que sur l'identifiant : deux titres de types
   * différents peuvent le partager. Le type est donc revérifié ici.
   */
  return new Set(
    (data ?? []).map((row) =>
      keyOf(row.media_type as MediaType, row.tmdb_id as number),
    ),
  );
}

export function isFlagged(
  flags: ReadonlySet<string>,
  mediaType: MediaType,
  tmdbId: number,
): boolean {
  return flags.has(keyOf(mediaType, tmdbId));
}

export async function setTitleUnavailable(
  mediaType: MediaType,
  tmdbId: number,
  unavailable: boolean,
  adminId: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("title_flags")
    .upsert(
      {
        tmdb_id: tmdbId,
        media_type: mediaType,
        unavailable,
        updated_at: new Date().toISOString(),
        updated_by: adminId,
      },
      { onConflict: "tmdb_id,media_type" },
    );

  if (error) {
    throw new Error(`Supabase title_flags: ${error.message}`);
  }
}
