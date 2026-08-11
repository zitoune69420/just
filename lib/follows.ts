import { supabaseAdmin } from "./supabase";

export interface PersonFollow {
  personId: number;
  addedAt: string;
}

interface PersonFollowRow {
  person_id: number;
  added_at: string;
}

export function isPersonId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export async function getFollowedPeople(
  userId: string,
): Promise<PersonFollow[]> {
  const { data, error } = await supabaseAdmin()
    .from("person_follows")
    .select("person_id, added_at")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase person_follows: ${error.message}`);
  }

  return (data ?? []).map((row: PersonFollowRow) => ({
    personId: row.person_id,
    addedAt: row.added_at,
  }));
}

export async function isFollowingPerson(
  userId: string,
  personId: number,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("person_follows")
    .select("person_id")
    .eq("user_id", userId)
    .eq("person_id", personId)
    .maybeSingle<{ person_id: number }>();

  if (error) {
    throw new Error(`Supabase person_follows: ${error.message}`);
  }

  return data !== null;
}

export async function followPerson(
  userId: string,
  personId: number,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("person_follows")
    .upsert(
      { user_id: userId, person_id: personId },
      { onConflict: "user_id,person_id", ignoreDuplicates: true },
    );

  if (error) {
    throw new Error(`Supabase person_follows: ${error.message}`);
  }
}

export async function unfollowPerson(
  userId: string,
  personId: number,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("person_follows")
    .delete()
    .eq("user_id", userId)
    .eq("person_id", personId);

  if (error) {
    throw new Error(`Supabase person_follows: ${error.message}`);
  }
}
