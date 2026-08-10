"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  toLocale,
  type Locale,
} from "./locales";

/** Enregistre la langue puis rafraîchit tout ce qui est rendu côté serveur. */
export async function setLocale(value: Locale): Promise<void> {
  const store = await cookies();
  store.set(LOCALE_COOKIE, toLocale(value), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LOCALE_MAX_AGE,
  });
  revalidatePath("/", "layout");
}
