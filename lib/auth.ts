import { cache } from "react";
import {
  openSession,
  readSessionCookie,
  type SessionUser,
} from "./session";
import { isSupabaseAdminConfigured } from "./supabase";
import { findUserById, toSessionUser, type UserRow } from "./users";

/**
 * Compte de la requête en cours, ou `null`.
 *
 * Contrairement à `openSession()`, cette fonction confronte le jeton à la base :
 * un compte supprimé ou dont le numéro de session a été incrémenté (changement
 * de mot de passe, réinitialisation, déconnexion globale) n'est plus reconnu,
 * même si son cookie est encore valide cryptographiquement. `cache()` garantit
 * une seule lecture par requête.
 */
export const currentUser = cache(async (): Promise<UserRow | null> => {
  let claims;
  try {
    claims = openSession(await readSessionCookie());
  } catch {
    return null;
  }
  if (!claims) return null;

  if (!isSupabaseAdminConfigured()) return null;

  let user: UserRow | null;
  try {
    user = await findUserById(claims.id);
  } catch {
    return null;
  }

  if (!user) return null;
  if (user.session_version !== claims.version) return null;

  return user;
});

export const getSession = cache(async (): Promise<SessionUser | null> => {
  let claims;
  try {
    claims = openSession(await readSessionCookie());
  } catch {
    return null;
  }
  if (!claims) return null;

  /**
   * Sans base, il n'y a rien à confronter : le mode « Discord seul » se
   * contente du jeton signé.
   */
  if (!isSupabaseAdminConfigured()) {
    return { id: claims.id, name: claims.name, avatar: claims.avatar };
  }

  const user = await currentUser();
  return user ? toSessionUser(user) : null;
});
