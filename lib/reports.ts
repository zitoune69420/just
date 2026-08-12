import { supabaseAdmin } from "./supabase";
import type { MediaType } from "./types";

/**
 * Ce qu'un compte peut reprocher à un titre. La liste reste courte à dessein :
 * un champ libre demanderait une modération, et le seul renseignement qui sert
 * vraiment est de savoir *quoi* est cassé, pas comment.
 */
export const REPORT_REASONS = [
  "unavailable",
  "wrong-title",
  "playback",
  "subtitles",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export function isReportReason(value: unknown): value is ReportReason {
  return (
    typeof value === "string" &&
    (REPORT_REASONS as readonly string[]).includes(value)
  );
}

export interface ReportInput {
  userId: string;
  tmdbId: number;
  mediaType: MediaType;
  season: number | null;
  episode: number | null;
  reason: ReportReason;
}

export interface ReportRow {
  id: number;
  tmdbId: number;
  mediaType: MediaType;
  season: number | null;
  episode: number | null;
  reason: ReportReason;
  resolved: boolean;
  createdAt: string;
  reporterName: string | null;
}

interface RawReportRow {
  id: number;
  tmdb_id: number;
  media_type: MediaType;
  season: number | null;
  episode: number | null;
  reason: ReportReason;
  resolved: boolean;
  created_at: string;
  users: { name: string } | null;
}

export const REPORTS_PAGE_SIZE = 30;

/**
 * Un même compte ne peut signaler qu'une fois un épisode donné : l'index unique
 * absorbe le doublon au lieu de le refuser. Renvoie `false` quand le
 * signalement existait déjà, pour que l'interface le dise plutôt que de
 * prétendre avoir enregistré quelque chose de neuf.
 */
export async function createReport(input: ReportInput): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("reports")
    .upsert(
      {
        user_id: input.userId,
        tmdb_id: input.tmdbId,
        media_type: input.mediaType,
        season: input.season,
        episode: input.episode,
        reason: input.reason,
      },
      {
        onConflict: "user_id, tmdb_id, media_type, season, episode",
        ignoreDuplicates: true,
      },
    )
    .select("id");

  if (error) {
    throw new Error(`Supabase reports: ${error.message}`);
  }

  return (data ?? []).length > 0;
}

export async function listReports(options: {
  page?: number;
  resolved?: boolean;
}): Promise<{ reports: ReportRow[]; hasMore: boolean }> {
  const page = Math.max(options.page ?? 1, 1);
  const from = (page - 1) * REPORTS_PAGE_SIZE;

  const { data, error } = await supabaseAdmin()
    .from("reports")
    .select(
      "id, tmdb_id, media_type, season, episode, reason, resolved, created_at, users (name)",
    )
    .eq("resolved", options.resolved ?? false)
    .order("created_at", { ascending: false })
    .range(from, from + REPORTS_PAGE_SIZE);

  if (error) {
    throw new Error(`Supabase reports: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as RawReportRow[];

  return {
    reports: rows.slice(0, REPORTS_PAGE_SIZE).map((row) => ({
      id: row.id,
      tmdbId: row.tmdb_id,
      mediaType: row.media_type,
      season: row.season,
      episode: row.episode,
      reason: row.reason,
      resolved: row.resolved,
      createdAt: row.created_at,
      reporterName: row.users?.name ?? null,
    })),
    hasMore: rows.length > REPORTS_PAGE_SIZE,
  };
}

export async function resolveReport(
  id: number,
  resolved: boolean,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("reports")
    .update({ resolved })
    .eq("id", id);

  if (error) {
    throw new Error(`Supabase reports: ${error.message}`);
  }
}
