import type { MessageKey } from "./i18n/messages/en";
import type { MediaType } from "./types";

export interface PlaybackDenied {
  reason: string;
  limit: number;
}

export type PlaybackResult =
  | { url: string; remaining: number | null }
  | { denied: PlaybackDenied };

const PLAYBACK_KEYS: Record<string, MessageKey> = {
  anonymous: "playback.anonymous",
  "movie-quota": "playback.movieQuota",
  "series-quota": "playback.seriesQuota",
  "monthly-quota": "playback.monthlyQuota",
  unavailable: "playback.unavailable",
  database: "playback.database",
};

export function playbackMessageKey(denied: PlaybackDenied): MessageKey {
  return PLAYBACK_KEYS[denied.reason] ?? "playback.database";
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
