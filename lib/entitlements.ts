import {
  claimGrant,
  countGrants,
  currentPeriod,
  hasGrant,
  periodFor,
} from "./grants";
import {
  FREE_MOVIE_LIMIT,
  FREE_SERIES_LIMIT,
  GOLD_MOVIES_PER_MONTH,
  type Role,
} from "./roles";
import type { MediaType } from "./types";

export type DenyReason =
  | "anonymous"
  | "movie-quota"
  | "series-quota"
  | "monthly-quota";

export type AccessDecision =
  | { allowed: true; consumed: boolean; remaining: number | null }
  | { allowed: false; reason: DenyReason; limit: number };

function unlimited(): AccessDecision {
  return { allowed: true, consumed: false, remaining: null };
}

export async function checkAccess(
  userId: string,
  role: Role,
  mediaType: MediaType,
  tmdbId: number,
): Promise<AccessDecision> {
  if (role === "platinum" || role === "admin") {
    return unlimited();
  }

  if (role === "gold" && mediaType === "tv") {
    return unlimited();
  }

  const period = periodFor(mediaType);

  if (await hasGrant(userId, mediaType, tmdbId, period)) {
    return { allowed: true, consumed: false, remaining: null };
  }

  if (role === "gold") {
    const used = await countGrants(userId, "movie", currentPeriod());
    if (used >= GOLD_MOVIES_PER_MONTH) {
      return {
        allowed: false,
        reason: "monthly-quota",
        limit: GOLD_MOVIES_PER_MONTH,
      };
    }
    return {
      allowed: true,
      consumed: true,
      remaining: GOLD_MOVIES_PER_MONTH - used - 1,
    };
  }

  const limit = mediaType === "movie" ? FREE_MOVIE_LIMIT : FREE_SERIES_LIMIT;
  const used = await countGrants(userId, mediaType);

  if (used >= limit) {
    return {
      allowed: false,
      reason: mediaType === "movie" ? "movie-quota" : "series-quota",
      limit,
    };
  }

  return { allowed: true, consumed: true, remaining: limit - used - 1 };
}

/**
 * Quota et limite applicables à une lecture payante, ou `null` quand le rôle
 * n'est pas décompté.
 */
function quotaFor(
  role: Role,
  mediaType: MediaType,
): { limit: number; countPeriod: string | null; reason: DenyReason } | null {
  if (role === "platinum" || role === "admin") return null;
  if (role === "gold" && mediaType === "tv") return null;

  if (role === "gold") {
    return {
      limit: GOLD_MOVIES_PER_MONTH,
      countPeriod: currentPeriod(),
      reason: "monthly-quota",
    };
  }

  return {
    limit: mediaType === "movie" ? FREE_MOVIE_LIMIT : FREE_SERIES_LIMIT,
    countPeriod: null,
    reason: mediaType === "movie" ? "movie-quota" : "series-quota",
  };
}

/**
 * Décompte réel. Contrairement à `checkAccess`, la vérification de la limite et
 * la consommation se font dans la même transaction côté base : deux lectures
 * lancées en parallèle ne peuvent plus franchir la limite ensemble.
 */
export async function consumeAccess(
  userId: string,
  role: Role,
  mediaType: MediaType,
  tmdbId: number,
): Promise<AccessDecision> {
  const quota = quotaFor(role, mediaType);
  if (!quota) return unlimited();

  const claim = await claimGrant({
    userId,
    mediaType,
    tmdbId,
    period: periodFor(mediaType),
    limit: quota.limit,
    countPeriod: quota.countPeriod,
  });

  if (!claim.allowed) {
    return { allowed: false, reason: quota.reason, limit: quota.limit };
  }

  if (!claim.consumed) {
    return { allowed: true, consumed: false, remaining: null };
  }

  return {
    allowed: true,
    consumed: true,
    remaining: Math.max(quota.limit - (claim.used ?? quota.limit), 0),
  };
}
