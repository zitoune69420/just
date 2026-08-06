import type { MediaType } from "./types";

export interface PlaybackDenied {
  reason: string;
  limit: number;
}

export type PlaybackResult =
  | { url: string; remaining: number | null }
  | { denied: PlaybackDenied };

export const PLAYBACK_MESSAGES: Record<string, string> = {
  anonymous: "Connectez-vous pour lancer la lecture.",
  "movie-quota":
    "Vos films gratuits sont épuisés. Passez à Gold ou Platine pour continuer.",
  "series-quota":
    "L’offre gratuite couvre une seule série. Passez à Gold pour toutes les séries.",
  "monthly-quota":
    "Vos films du mois sont épuisés. Passez à Platine pour un accès illimité.",
  unavailable: "Aucune source de lecture n’est configurée sur ce serveur.",
  database: "Base de données injoignable. Réessayez plus tard.",
};

export function playbackMessage(denied: PlaybackDenied): string {
  return PLAYBACK_MESSAGES[denied.reason] ?? PLAYBACK_MESSAGES.database;
}

export async function requestPlayback(
  mediaType: MediaType,
  tmdbId: number,
  season: number | null,
  episode: number | null,
): Promise<PlaybackResult> {
  try {
    const response = await fetch("/api/playback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaType, tmdbId, season, episode }),
    });

    const data = (await response.json().catch(() => null)) as
      | { url?: string; remaining?: number | null; reason?: string; limit?: number }
      | null;

    if (response.ok && data?.url) {
      return { url: data.url, remaining: data.remaining ?? null };
    }

    return {
      denied: {
        reason: data?.reason ?? "database",
        limit: data?.limit ?? 0,
      },
    };
  } catch {
    return { denied: { reason: "database", limit: 0 } };
  }
}
