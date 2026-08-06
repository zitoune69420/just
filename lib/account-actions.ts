"use server";

import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from "./password";
import { getSession } from "./session";
import { isSupabaseAdminConfigured } from "./supabase";
import { EmailTakenError, findUserById, setCredentials } from "./users";
import { isEmail, readField } from "./validation";

export interface AccountState {
  error: string | null;
  success: string | null;
}

export async function savePassword(
  _prevState: AccountState,
  formData: FormData,
): Promise<AccountState> {
  if (!isSupabaseAdminConfigured()) {
    return { error: "Base de données non configurée.", success: null };
  }

  const session = await getSession();
  if (!session) {
    return { error: "Session expirée. Reconnectez-vous.", success: null };
  }

  const user = await findUserById(session.id);
  if (!user) {
    return { error: "Compte introuvable.", success: null };
  }

  const email = readField(formData, "email");
  const current = readField(formData, "currentPassword");
  const password = readField(formData, "password");
  const confirm = readField(formData, "confirmPassword");

  if (!user.email && !isEmail(email)) {
    return { error: "Adresse e-mail invalide.", success: null };
  }

  if (user.password_hash && !(await verifyPassword(current, user.password_hash))) {
    return { error: "Mot de passe actuel incorrect.", success: null };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: `Le mot de passe doit faire au moins ${PASSWORD_MIN_LENGTH} caractères.`,
      success: null,
    };
  }

  if (password !== confirm) {
    return { error: "Les deux mots de passe ne correspondent pas.", success: null };
  }

  try {
    await setCredentials(user.id, {
      email: user.email ? undefined : email,
      passwordHash: await hashPassword(password),
    });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { error: "Un compte existe déjà avec cette adresse.", success: null };
    }
    throw error;
  }

  return {
    error: null,
    success: user.password_hash
      ? "Mot de passe modifié."
      : "Mot de passe défini. Vous pouvez maintenant vous connecter avec votre e-mail.",
  };
}
