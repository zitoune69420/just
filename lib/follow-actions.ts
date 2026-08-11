"use server";

import { getSession } from "./auth";
import { followPerson, isPersonId, unfollowPerson } from "./follows";
import { isSupabaseAdminConfigured } from "./supabase";

export type FollowResult =
  | { ok: true; following: boolean }
  | { ok: false; reason: "unauthenticated" | "unavailable" | "invalid" };

export async function togglePersonFollow(
  personId: number,
  following: boolean,
): Promise<FollowResult> {
  if (!isPersonId(personId)) {
    return { ok: false, reason: "invalid" };
  }

  const user = await getSession();
  if (!user) {
    return { ok: false, reason: "unauthenticated" };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, reason: "unavailable" };
  }

  if (following) {
    await followPerson(user.id, personId);
  } else {
    await unfollowPerson(user.id, personId);
  }

  return { ok: true, following };
}
