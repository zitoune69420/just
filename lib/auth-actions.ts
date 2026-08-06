"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from "./password";
import { SESSION_COOKIE, sealSession, sessionCookieOptions } from "./session";
import { isSupabaseAdminConfigured } from "./supabase";
import {
  createUserWithPassword,
  EmailTakenError,
  findUserByEmail,
  toSessionUser,
  type UserRow,
} from "./users";
import { isEmail } from "./validation";

export interface CredentialsState {
  error: string | null;
}

const NAME_MAX_LENGTH = 40;

const DUMMY_HASH =
  "scrypt$00000000000000000000000000000000$00000000000000000000000000000000";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeReturnTo(formData: FormData): string {
  const path = field(formData, "returnTo");
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

async function startSession(user: UserRow): Promise<void> {
  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    sealSession(toSessionUser(user)),
    sessionCookieOptions(),
  );
}

export async function signIn(
  _prevState: CredentialsState,
  formData: FormData,
): Promise<CredentialsState> {
  if (!isSupabaseAdminConfigured()) {
    return { error: "La connexion par mot de passe n’est pas configurée." };
  }

  const email = field(formData, "email");
  const password = field(formData, "password");

  if (!isEmail(email) || password.length === 0) {
    return { error: "Adresse e-mail ou mot de passe invalide." };
  }

  const user = await findUserByEmail(email);
  const valid = await verifyPassword(
    password,
    user?.password_hash ?? DUMMY_HASH,
  );

  if (!user || !valid) {
    return { error: "Adresse e-mail ou mot de passe incorrect." };
  }

  await startSession(user);
  redirect(safeReturnTo(formData));
}

export async function signUp(
  _prevState: CredentialsState,
  formData: FormData,
): Promise<CredentialsState> {
  if (!isSupabaseAdminConfigured()) {
    return { error: "La création de compte n’est pas configurée." };
  }

  const name = field(formData, "name").slice(0, NAME_MAX_LENGTH);
  const email = field(formData, "email");
  const password = field(formData, "password");

  if (name.length < 2) {
    return { error: "Le pseudo doit faire au moins 2 caractères." };
  }
  if (!isEmail(email)) {
    return { error: "Adresse e-mail invalide." };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: `Le mot de passe doit faire au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    };
  }

  let user: UserRow;
  try {
    user = await createUserWithPassword({
      email,
      name,
      passwordHash: await hashPassword(password),
    });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { error: "Un compte existe déjà avec cette adresse." };
    }
    throw error;
  }

  await startSession(user);
  redirect(safeReturnTo(formData));
}

export async function authenticate(
  prevState: CredentialsState,
  formData: FormData,
): Promise<CredentialsState> {
  return field(formData, "mode") === "signup"
    ? signUp(prevState, formData)
    : signIn(prevState, formData);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
