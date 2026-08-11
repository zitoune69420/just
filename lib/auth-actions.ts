"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslator } from "./i18n/server";
import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from "./password";
import {
  allowByIpAndSubject,
  allowByIpShared,
  MINUTE,
  HOUR,
} from "./rate-limit";
import { safeInternalPathOr } from "./redirects";
import { SESSION_COOKIE, sealSession, sessionCookieOptions } from "./session";
import { isSupabaseAdminConfigured } from "./supabase";
import {
  bumpSessionVersion,
  createUserWithPassword,
  EmailTakenError,
  findUserByEmail,
  toSessionUser,
  type UserRow,
} from "./users";
import { getSession } from "./auth";
import { isEmail } from "./validation";

export interface CredentialsState {
  error: string | null;
}

const NAME_MAX_LENGTH = 40;

/** Cinq essais par quart d'heure, par IP et par adresse visée. */
const SIGN_IN_QUOTA = { limit: 5, windowMs: 15 * MINUTE };

const SIGN_UP_QUOTA = { limit: 5, windowMs: HOUR };

/**
 * Condensat factice aux paramètres courants : une adresse inconnue coûte le
 * même temps de calcul qu'une adresse connue, sinon la latence trahit
 * l'existence du compte.
 */
const DUMMY_HASH = `scrypt$65536$8$2$${"0".repeat(32)}$${"0".repeat(128)}`;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function safeReturnTo(formData: FormData): string {
  return safeInternalPathOr(field(formData, "returnTo"), "/");
}

async function startSession(user: UserRow): Promise<void> {
  const store = await cookies();
  store.set(
    SESSION_COOKIE,
    sealSession(toSessionUser(user), user.session_version),
    sessionCookieOptions(),
  );
}

export async function signIn(
  _prevState: CredentialsState,
  formData: FormData,
): Promise<CredentialsState> {
  const t = await getTranslator();

  if (!isSupabaseAdminConfigured()) {
    return { error: t("error.signInNotConfigured") };
  }

  const email = field(formData, "email");
  const password = field(formData, "password");

  if (!isEmail(email) || password.length === 0) {
    return { error: t("error.invalidCredentials") };
  }

  if (!(await allowByIpAndSubject("sign-in", email, SIGN_IN_QUOTA))) {
    return { error: t("error.tooManyAttempts") };
  }

  const user = await findUserByEmail(email);
  const valid = await verifyPassword(
    password,
    user?.password_hash ?? DUMMY_HASH,
  );

  if (!user || !valid) {
    return { error: t("error.wrongCredentials") };
  }

  await startSession(user);
  redirect(safeReturnTo(formData));
}

export async function signUp(
  _prevState: CredentialsState,
  formData: FormData,
): Promise<CredentialsState> {
  const t = await getTranslator();

  if (!isSupabaseAdminConfigured()) {
    return { error: t("error.signUpNotConfigured") };
  }

  const name = field(formData, "name").slice(0, NAME_MAX_LENGTH);
  const email = field(formData, "email");
  const password = field(formData, "password");

  if (name.length < 2) {
    return { error: t("error.nameTooShort") };
  }
  if (!isEmail(email)) {
    return { error: t("error.invalidEmail") };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: t("error.passwordTooShort", { min: PASSWORD_MIN_LENGTH }),
    };
  }

  if (!(await allowByIpShared("sign-up", SIGN_UP_QUOTA))) {
    return { error: t("error.tooManyAttempts") };
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
      return { error: t("error.emailTaken") };
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

/**
 * Supprimer le cookie ne suffit pas : le jeton reste valable trente jours pour
 * qui en détiendrait une copie. On incrémente donc aussi le numéro de session,
 * ce qui invalide tous les jetons déjà émis pour ce compte.
 */
export async function logout() {
  const session = await getSession();

  if (session && isSupabaseAdminConfigured()) {
    try {
      await bumpSessionVersion(session.id);
    } catch (error) {
      console.error("[auth] Révocation des sessions impossible", error);
    }
  }

  (await cookies()).delete(SESSION_COOKIE);
  redirect("/");
}
