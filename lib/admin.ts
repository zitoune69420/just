import { currentUser } from "./auth";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase";
import type { UserRow } from "./users";

export const USERS_PAGE_SIZE = 20;

/**
 * Vue de liste : volontairement sans `password_hash` ni `session_version`. Le
 * condensat ne sert à rien pour afficher un tableau, et une ligne qui ne le
 * porte pas ne peut pas le laisser fuiter si elle finit un jour dans un
 * composant client.
 */
export type UserSummary = Omit<UserRow, "password_hash" | "session_version">;

export interface UserListing {
  users: UserSummary[];
  total: number;
}

const LIST_COLUMNS =
  "id, email, name, avatar, discord_id, discord_username, role";

export async function currentAdmin(): Promise<UserRow | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const user = await currentUser();
  return user?.role === "admin" ? user : null;
}

export async function listUsers(options: {
  query?: string;
  page?: number;
}): Promise<UserListing> {
  const page = Math.max(options.page ?? 1, 1);
  const from = (page - 1) * USERS_PAGE_SIZE;

  let request = supabaseAdmin()
    .from("users")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + USERS_PAGE_SIZE - 1);

  const query = options.query?.trim();
  if (query) {
    const escaped = query.replace(/[%,()]/g, " ");
    request = request.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }

  const { data, count, error } = await request;

  if (error) {
    throw new Error(`Supabase users: ${error.message}`);
  }

  return { users: (data ?? []) as UserSummary[], total: count ?? 0 };
}
