import {
  addGrant,
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

export async function consumeAccess(
  userId: string,
  role: Role,
  mediaType: MediaType,
  tmdbId: number,
): Promise<AccessDecision> {
  const decision = await checkAccess(userId, role, mediaType, tmdbId);

  if (decision.allowed && decision.consumed) {
    await addGrant(userId, mediaType, tmdbId, periodFor(mediaType));
  }

  return decision;
}
