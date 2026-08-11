import { supabaseAdmin } from "./supabase";
import type { Role } from "./roles";
import type { SessionUser } from "./session";

export interface UserRow {
  id: string;
  email: string | null;
  password_hash: string | null;
  name: string;
  avatar: string | null;
  discord_id: string | null;
  discord_username: string | null;
  role: Role;
  session_version: number;
}

const COLUMNS =
  "id, email, password_hash, name, avatar, discord_id, discord_username, role, session_version";

const DUPLICATE_CODE = "23505";

export class EmailTakenError extends Error {}

export class DiscordTakenError extends Error {}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function toSessionUser(row: UserRow): SessionUser {
  return { id: row.id, name: row.name, avatar: row.avatar };
}

async function findBy(column: string, value: string): Promise<UserRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select(COLUMNS)
    .eq(column, value)
    .maybeSingle<UserRow>();

  if (error) {
    throw new Error(`Supabase users: ${error.message}`);
  }
  return data;
}

export function findUserByEmail(email: string): Promise<UserRow | null> {
  return findBy("email", normalizeEmail(email));
}

export function findUserByDiscordId(
  discordId: string,
): Promise<UserRow | null> {
  return findBy("discord_id", discordId);
}

export function findUserById(id: string): Promise<UserRow | null> {
  return findBy("id", id);
}

export async function createUserWithPassword(input: {
  email: string;
  passwordHash: string;
  name: string;
  role?: Role;
}): Promise<UserRow> {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .insert({
      email: normalizeEmail(input.email),
      password_hash: input.passwordHash,
      name: input.name,
      role: input.role ?? "user",
    })
    .select(COLUMNS)
    .single<UserRow>();

  if (error) {
    if (error.code === DUPLICATE_CODE) {
      throw new EmailTakenError(input.email);
    }
    throw new Error(`Supabase users: ${error.message}`);
  }
  return data;
}

async function update(id: string, patch: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLUMNS)
    .single<UserRow>();

  if (error) {
    throw new Error(`Supabase users: ${error.message}`);
  }
  return data;
}

/**
 * Incrémente le numéro de session du compte : tous les cookies émis avant cet
 * appel cessent d'être reconnus. Renvoie le nouveau numéro, pour ré-émettre un
 * jeton à l'utilisateur qui est à l'origine du changement.
 */
export async function bumpSessionVersion(id: string): Promise<number> {
  const { data, error } = await supabaseAdmin().rpc("bump_session_version", {
    p_user_id: id,
  });

  if (error) {
    throw new Error(`Supabase bump_session_version: ${error.message}`);
  }
  return typeof data === "number" ? data : 0;
}

/**
 * Change le mot de passe et révoque au passage toutes les sessions ouvertes :
 * un cookie volé ne survit pas à une réinitialisation.
 */
export async function setCredentials(
  id: string,
  input: { email?: string; passwordHash: string },
): Promise<UserRow> {
  const patch: Record<string, unknown> = { password_hash: input.passwordHash };
  if (input.email) {
    patch.email = normalizeEmail(input.email);
  }

  const { data, error } = await supabaseAdmin()
    .from("users")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLUMNS)
    .single<UserRow>();

  if (error) {
    if (error.code === DUPLICATE_CODE) {
      throw new EmailTakenError(input.email ?? "");
    }
    throw new Error(`Supabase users: ${error.message}`);
  }

  return { ...data, session_version: await bumpSessionVersion(id) };
}

export async function linkDiscordToUser(
  userId: string,
  profile: {
    discordId: string;
    username: string;
    email: string | null;
    avatar: string | null;
  },
): Promise<UserRow> {
  const owner = await findUserByDiscordId(profile.discordId);
  if (owner) {
    if (owner.id !== userId) throw new DiscordTakenError(profile.discordId);
    return owner;
  }

  const current = await findUserById(userId);
  if (!current) {
    throw new Error("Compte introuvable");
  }

  const patch: Record<string, unknown> = {
    discord_id: profile.discordId,
    discord_username: profile.username,
    avatar: current.avatar ?? profile.avatar,
  };

  if (!current.email && profile.email) {
    const holder = await findUserByEmail(profile.email);
    if (!holder) {
      patch.email = normalizeEmail(profile.email);
    }
  }

  return update(userId, patch);
}

export async function upsertDiscordUser(input: {
  discordId: string;
  username: string;
  email: string | null;
  name: string;
  avatar: string | null;
}): Promise<UserRow> {
  const linked = await findUserByDiscordId(input.discordId);
  if (linked) {
    return update(linked.id, {
      name: input.name,
      avatar: input.avatar,
      discord_username: input.username,
    });
  }

  if (input.email) {
    const existing = await findUserByEmail(input.email);
    if (existing) {
      return update(existing.id, {
        discord_id: input.discordId,
        discord_username: input.username,
        avatar: existing.avatar ?? input.avatar,
      });
    }
  }

  const { data, error } = await supabaseAdmin()
    .from("users")
    .insert({
      discord_id: input.discordId,
      discord_username: input.username,
      email: input.email ? normalizeEmail(input.email) : null,
      name: input.name,
      avatar: input.avatar,
    })
    .select(COLUMNS)
    .single<UserRow>();

  if (error) {
    throw new Error(`Supabase users: ${error.message}`);
  }
  return data;
}
