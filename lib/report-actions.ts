"use server";

import { revalidatePath } from "next/cache";
import { currentAdmin } from "./admin";
import { getSession } from "./auth";
import { isMediaType, isTmdbId } from "./collections";
import { allowByUser, HOUR } from "./rate-limit";
import {
  createReport,
  isReportReason,
  resolveReport,
  type ReportReason,
} from "./reports";
import { isSupabaseAdminConfigured } from "./supabase";
import { setTitleUnavailable } from "./title-flags";
import type { MediaType } from "./types";

export type ReportResult =
  | { ok: true; duplicate: boolean }
  | {
      ok: false;
      reason: "unauthenticated" | "unavailable" | "invalid" | "throttled";
    };

/**
 * Signaler coûte peu et sert rarement plus de quelques fois par heure. La borne
 * n'existe pas contre l'usage normal mais contre le compte qui viderait le
 * catalogue dans la table.
 */
const QUOTA = { limit: 10, windowMs: HOUR };

function episodeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

export async function reportTitle(
  mediaType: MediaType,
  tmdbId: number,
  reason: ReportReason,
  season: number | null = null,
  episode: number | null = null,
): Promise<ReportResult> {
  if (!isMediaType(mediaType) || !isTmdbId(tmdbId) || !isReportReason(reason)) {
    return { ok: false, reason: "invalid" };
  }

  const user = await getSession();
  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, reason: "unavailable" };
  }

  if (!allowByUser("report", user.id, QUOTA)) {
    return { ok: false, reason: "throttled" };
  }

  try {
    const created = await createReport({
      userId: user.id,
      tmdbId,
      mediaType,
      season: mediaType === "tv" ? episodeNumber(season) : null,
      episode: mediaType === "tv" ? episodeNumber(episode) : null,
      reason,
    });
    return { ok: true, duplicate: !created };
  } catch (error) {
    console.error("[report] Enregistrement impossible", error);
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Réservé à l'administration : signale aux comptes qu'un titre est injouable.
 *
 * Découplé de `markReportResolved` à dessein. Traiter un signalement veut dire
 * « je l'ai lu » ; marquer le titre veut dire « c'est confirmé, prévenez tout le
 * monde ». Les deux arrivent souvent ensemble, mais pas toujours : un
 * signalement peut être infondé, et un titre peut tomber sans qu'on l'ait
 * signalé.
 */
export async function markTitleUnavailable(
  mediaType: MediaType,
  tmdbId: number,
  unavailable: boolean,
): Promise<{ ok: boolean }> {
  if (!isMediaType(mediaType) || !isTmdbId(tmdbId)) return { ok: false };

  const admin = await currentAdmin();
  if (!admin) return { ok: false };

  try {
    await setTitleUnavailable(mediaType, tmdbId, unavailable, admin.id);
  } catch (error) {
    console.error("[admin] Marquage du titre impossible", error);
    return { ok: false };
  }

  revalidatePath("/admin/reports");
  revalidatePath(`/${mediaType}/${tmdbId}`);
  return { ok: true };
}

/** Réservé à l'administration : marque un signalement traité, ou le rouvre. */
export async function markReportResolved(
  id: number,
  resolved: boolean,
): Promise<{ ok: boolean }> {
  if (!Number.isInteger(id) || id < 1) return { ok: false };

  if (!(await currentAdmin())) return { ok: false };

  try {
    await resolveReport(id, resolved);
  } catch {
    return { ok: false };
  }

  revalidatePath("/admin/reports");
  return { ok: true };
}
