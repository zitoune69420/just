"use server";

import { getTranslator } from "./i18n/server";
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
  const t = await getTranslator();

  if (!isSupabaseAdminConfigured()) {
    return { error: t("error.noDatabase"), success: null };
  }

  const session = await getSession();
  if (!session) {
    return { error: t("error.sessionExpired"), success: null };
  }

  const user = await findUserById(session.id);
  if (!user) {
    return { error: t("error.accountNotFound"), success: null };
  }

  const email = readField(formData, "email");
  const current = readField(formData, "currentPassword");
  const password = readField(formData, "password");
  const confirm = readField(formData, "confirmPassword");

  if (!user.email && !isEmail(email)) {
    return { error: t("error.invalidEmail"), success: null };
  }

  if (user.password_hash && !(await verifyPassword(current, user.password_hash))) {
    return { error: t("error.wrongCurrentPassword"), success: null };
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      error: t("error.passwordTooShort", { min: PASSWORD_MIN_LENGTH }),
      success: null,
    };
  }

  if (password !== confirm) {
    return { error: t("error.passwordMismatch"), success: null };
  }

  try {
    await setCredentials(user.id, {
      email: user.email ? undefined : email,
      passwordHash: await hashPassword(password),
    });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return { error: t("error.emailTaken"), success: null };
    }
    throw error;
  }

  return {
    error: null,
    success: user.password_hash
      ? t("form.passwordChanged")
      : t("form.passwordSet"),
  };
}
