import type { MediaType } from "./types";

const DEFAULT_SUBTITLE_LANG = "fr";

/**
 * Uniquement des variables serveur : préfixées `NEXT_PUBLIC_`, elles seraient
 * inscrites en clair dans le bundle client et l'adresse du serveur de flux
 * n'aurait plus rien de confidentiel.
 */
function base(): string | null {
  const value = process.env.STREAM_BASE_URL;
  return value ? value.replace(/\/+$/, "") : null;
}

function subtitleLang(): string | null {
  const value = process.env.STREAM_SUBTITLE_LANG ?? DEFAULT_SUBTITLE_LANG;
  const code = value.trim().toLowerCase();
  return /^[a-z]{2,3}$/.test(code) ? code : null;
}

export function isStreamConfigured(): boolean {
  return base() !== null;
}

/**
 * En deçà, reprendre n'apporte rien : on est encore au générique de début, et
 * un `startAt` de quelques secondes coûte plus qu'il ne rend.
 */
const MIN_RESUME_SECONDS = 30;

export function buildStreamUrl(
  mediaType: MediaType,
  tmdbId: number,
  season: number | null,
  episode: number | null,
  startAtSeconds: number | null = null,
): string | null {
  const root = base();
  if (!root) return null;
  if (mediaType === "tv" && (season === null || episode === null)) return null;

  const path = mediaType === "tv" ? "tv" : "movie";
  const params = new URLSearchParams({ tmdb: String(tmdbId) });
  if (mediaType === "tv") {
    params.set("season", String(season));
    params.set("episode", String(episode));
  }

  const lang = subtitleLang();
  if (lang) params.set("ds_lang", lang);

  if (startAtSeconds !== null && startAtSeconds >= MIN_RESUME_SECONDS) {
    params.set("startAt", String(Math.floor(startAtSeconds)));
  }

  return `${root}/${path}?${params.toString()}`;
}
