import { createHash, randomBytes } from "node:crypto";
import { supabaseAdmin } from "./supabase";

export const RESET_TTL_MINUTES = 60;

const TOKEN_BYTES = 32;

export interface ResetRow {
  id: number;
  user_id: string;
}

/** Le lien contient le jeton en clair, la base n'en garde que l'empreinte. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createResetToken(): { token: string; hash: string } {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, hash: hashResetToken(token) };
}

export async function storeReset(
  userId: string,
  tokenHash: string,
): Promise<void> {
  const expiresAt = new Date(
    Date.now() + RESET_TTL_MINUTES * 60 * 1000,
  ).toISOString();

  const { error } = await supabaseAdmin()
    .from("password_resets")
    .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt });

  if (error) {
    throw new Error(`Supabase password_resets: ${error.message}`);
  }
}

/** Demande encore valable pour ce jeton : ni utilisée, ni expirée. */
export async function findValidReset(
  tokenHash: string,
): Promise<ResetRow | null> {
  const { data, error } = await supabaseAdmin()
    .from("password_resets")
    .select("id, user_id")
    .eq("token_hash", tokenHash)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<ResetRow>();

  if (error) {
    throw new Error(`Supabase password_resets: ${error.message}`);
  }
  return data;
}

export async function markResetUsed(id: number): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("password_resets")
    .update({ used_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Supabase password_resets: ${error.message}`);
  }
}

/** Neutralise les demandes en cours d'un compte (nouvelle demande, ou succès). */
export async function invalidateResets(userId: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("password_resets")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null);

  if (error) {
    throw new Error(`Supabase password_resets: ${error.message}`);
  }
}
