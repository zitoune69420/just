"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentAdmin } from "./admin";
import { hashPassword, PASSWORD_MIN_LENGTH } from "./password";
import { isRole } from "./roles";
import { supabaseAdmin } from "./supabase";
import {
  createUserWithPassword,
  EmailTakenError,
  normalizeEmail,
  type UserRow,
} from "./users";
import { isEmail, readField } from "./validation";

export interface AdminUserState {
  error: string | null;
  success: string | null;
}

const DUPLICATE_CODE = "23505";

const NAME_MAX_LENGTH = 40;

export async function createUser(
  _prevState: AdminUserState,
  formData: FormData,
): Promise<AdminUserState> {
  const admin = await currentAdmin();
  if (!admin) {
    return { error: "Accès refusé.", success: null };
  }

  const name = readField(formData, "name").slice(0, NAME_MAX_LENGTH);
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const role = readField(formData, "role");

  if (name.length < 2) {
    return { error: "Le pseudo doit faire au moins 2 caractères.", success: null };
  }
  if (!isEmail(email)) {
    return { error: "Adresse e-mail invalide.", success: null };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: `Le mot de passe doit faire au moins ${PASSWORD_MIN_LENGTH} caractères.`,
      success: null,
    };
  }
  if (!isRole(role)) {
    return { error: "Rôle inconnu.", success: null };
  }

  let created: UserRow;
  try {
    created = await createUserWithPassword({
      name,
      email,
      role,
      passwordHash: await hashPassword(password),
    });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { error: "Un compte existe déjà avec cette adresse.", success: null };
    }
    return { error: "Échec de la création du compte.", success: null };
  }

  revalidatePath("/admin");
  redirect(`/admin/users/${created.id}`);
}

export async function saveUser(
  _prevState: AdminUserState,
  formData: FormData,
): Promise<AdminUserState> {
  const admin = await currentAdmin();
  if (!admin) {
    return { error: "Accès refusé.", success: null };
  }

  const id = readField(formData, "id");
  const name = readField(formData, "name").slice(0, NAME_MAX_LENGTH);
  const email = readField(formData, "email");
  const role = readField(formData, "role");

  if (!id) {
    return { error: "Compte introuvable.", success: null };
  }
  if (name.length < 2) {
    return { error: "Le pseudo doit faire au moins 2 caractères.", success: null };
  }
  if (email && !isEmail(email)) {
    return { error: "Adresse e-mail invalide.", success: null };
  }
  if (!isRole(role)) {
    return { error: "Rôle inconnu.", success: null };
  }
  if (id === admin.id && role !== "admin") {
    return {
      error: "Vous ne pouvez pas retirer votre propre rôle administrateur.",
      success: null,
    };
  }

  const password = readField(formData, "password");
  if (password && password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: `Le mot de passe doit faire au moins ${PASSWORD_MIN_LENGTH} caractères.`,
      success: null,
    };
  }

  const patch: Record<string, unknown> = {
    name,
    email: email ? normalizeEmail(email) : null,
    role,
    updated_at: new Date().toISOString(),
  };

  if (password) {
    patch.password_hash = await hashPassword(password);
  }

  const { error } = await supabaseAdmin().from("users").update(patch).eq("id", id);

  if (error) {
    if (error.code === DUPLICATE_CODE) {
      return {
        error: "Un autre compte utilise déjà cette adresse.",
        success: null,
      };
    }
    return { error: `Échec de l’enregistrement : ${error.message}`, success: null };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/users/${id}`);

  return {
    error: null,
    success: password
      ? "Compte mis à jour, mot de passe remplacé."
      : "Compte mis à jour.",
  };
}
