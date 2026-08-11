import { currentUser } from "./auth";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase";
import type { UserRow } from "./users";

export const USERS_PAGE_SIZE = 20;

export interface UserListing {
  users: UserRow[];
  total: number;
}

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
    .select(
      "id, email, password_hash, name, avatar, discord_id, discord_username, role",
      { count: "exact" },
    )
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

  return { users: (data ?? []) as UserRow[], total: count ?? 0 };
}
