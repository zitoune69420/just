"use server";

import { redirect } from "next/navigation";
import { getTranslator } from "./i18n/server";
import { sendMail } from "./mailer";
import { hashPassword, PASSWORD_MIN_LENGTH } from "./password";
import {
  createResetToken,
  findValidReset,
  hashResetToken,
  invalidateResets,
  markResetUsed,
  RESET_TTL_MINUTES,
  storeReset,
} from "./password-resets";
import {
  allowByIpAndSubject,
  allowByIpShared,
  HOUR,
  MINUTE,
} from "./rate-limit";
import { isSupabaseAdminConfigured } from "./supabase";
import { findUserByEmail, findUserById, setCredentials } from "./users";
import { isEmail, readField } from "./validation";

export interface ResetRequestState {
  error: string | null;
  sent: boolean;
}

export interface ResetState {
  error: string | null;
}

/** Réponse volontairement identique que l'adresse existe ou non. */
const GENERIC_SENT: ResetRequestState = { error: null, sent: true };

const REQUEST_QUOTA = { limit: 3, windowMs: 15 * MINUTE };

const RESET_QUOTA = { limit: 10, windowMs: HOUR };

/**
 * Origine du lien de réinitialisation.
 *
 * Elle ne doit jamais venir de l'en-tête `Host` : il est fourni par l'appelant,
 * et un attaquant déclenchant l'envoi pour la boîte d'une victime pourrait
 * ainsi faire pointer le lien — jeton compris — vers son propre domaine. En
 * l'absence de `NEXT_PUBLIC_APP_URL`, on n'envoie rien plutôt que d'envoyer un
 * lien empoisonné ; en développement, `http://localhost:3000` reste le défaut.
 */
function appOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  return null;
}

export async function requestPasswordReset(
  _prevState: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const t = await getTranslator();

  if (!isSupabaseAdminConfigured()) {
    return { error: t("error.noDatabase"), sent: false };
  }

  const email = readField(formData, "email");
  if (!isEmail(email)) {
    return { error: t("error.invalidEmail"), sent: false };
  }

  const origin = appOrigin();
  if (!origin) {
    return { error: t("error.resetNotConfigured"), sent: false };
  }

  if (!(await allowByIpAndSubject("reset-request", email, REQUEST_QUOTA))) {
    return { error: t("error.tooManyAttempts"), sent: false };
  }

  let user: Awaited<ReturnType<typeof findUserByEmail>>;
  try {
    user = await findUserByEmail(email);
  } catch {
    return { error: t("error.databaseUnreachable"), sent: false };
  }

  if (!user) return GENERIC_SENT;

  const { token, hash } = createResetToken();

  try {
    await invalidateResets(user.id);
    await storeReset(user.id, hash);
  } catch {
    return { error: t("error.databaseUnreachable"), sent: false };
  }

  const link = `${origin}/reset-password?token=${token}`;

  await sendMail({
    to: email,
    subject: t("reset.mailSubject"),
    text: [
      t("reset.mailGreeting", { name: user.name }),
      "",
      t("reset.mailBody"),
      t("reset.mailValidity", { minutes: RESET_TTL_MINUTES }),
      link,
      "",
      t("reset.mailIgnore"),
    ].join("\n"),
  });

  return GENERIC_SENT;
}

export async function resetPassword(
  _prevState: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const t = await getTranslator();

  if (!isSupabaseAdminConfigured()) {
    return { error: t("error.noDatabase") };
  }

  if (!(await allowByIpShared("reset-submit", RESET_QUOTA))) {
    return { error: t("error.tooManyAttempts") };
  }

  const token = readField(formData, "token");
  const password = readField(formData, "password");
  const confirm = readField(formData, "confirmPassword");

  if (!token) {
    return { error: t("error.resetInvalid") };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: t("error.passwordTooShort", { min: PASSWORD_MIN_LENGTH }),
    };
  }
  if (password !== confirm) {
    return { error: t("error.passwordMismatch") };
  }

  let reset: Awaited<ReturnType<typeof findValidReset>>;
  try {
    reset = await findValidReset(hashResetToken(token));
  } catch {
    return { error: t("error.databaseUnreachable") };
  }

  if (!reset) {
    return { error: t("error.resetExpired") };
  }

  const user = await findUserById(reset.user_id);
  if (!user) {
    return { error: t("error.accountNotFound") };
  }

  await setCredentials(user.id, { passwordHash: await hashPassword(password) });
  await markResetUsed(reset.id);
  await invalidateResets(user.id);

  redirect("/login?reset=done");
}
