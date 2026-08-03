import { findArchiveMovie } from "./archive";
import type { MediaType } from "./types";

export type StreamSource =
  | { kind: "embed"; url: string }
  | { kind: "file"; url: string };

export interface StreamRequest {
  type: MediaType;
  tmdbId: number;
  originalTitle: string;
  year: string | null;
  season?: number;
  episode?: number;
}

const CATALOG: Record<string, StreamSource> = {};

function catalogKey({ type, tmdbId, season, episode }: StreamRequest): string {
  const base = `${type}:${tmdbId}`;
  return season && episode ? `${base}:${season}:${episode}` : base;
}

export async function resolveStreamSource(
  request: StreamRequest,
): Promise<StreamSource | null> {
  const declared = CATALOG[catalogKey(request)];
  if (declared) return declared;

  if (request.type !== "movie" || !request.year) return null;
  return findArchiveMovie(request.originalTitle, request.year);
}
