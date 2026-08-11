import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Le nom change à chaque évolution du format : les jetons de l'ancienne version
 * (sans numéro de session) ne sont pas relus, ils expirent d'eux-mêmes.
 */
export const SESSION_COOKIE = "just_session_v3";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/** Un secret plus court ne protège pas sérieusement un HMAC-SHA256. */
const MIN_SECRET_LENGTH = 32;

export interface SessionUser {
  id: string;
  name: string;
  avatar: string | null;
}

export interface SessionClaims extends SessionUser {
  /**
   * Numéro de session du compte au moment de la connexion. Il est comparé à
   * celui stocké en base : l'incrémenter révoque tous les jetons émis avant.
   */
  version: number;
}

interface SessionPayload extends SessionUser {
  exp: number;
  sv: number;
}

export function hasSessionSecret(): boolean {
  const secret = process.env.AUTH_SECRET;
  return Boolean(secret && secret.length >= MIN_SECRET_LENGTH);
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET manquante. Ajoutez-la dans .env.local (voir .env.example).",
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `AUTH_SECRET trop courte : ${MIN_SECRET_LENGTH} caractères minimum (openssl rand -base64 32).`,
    );
  }
  return secret;
}

/**
 * HMAC cloisonné par usage : deux jetons de nature différente signés avec le
 * même secret ne doivent jamais être interchangeables.
 */
export function signFor(namespace: string, data: string): string {
  return createHmac("sha256", sessionSecret())
    .update(`${namespace}.${data}`)
    .digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function sealSession(user: SessionUser, version: number): string {
  const payload: SessionPayload = {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    sv: version,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signFor("session", body)}`;
}

/**
 * Vérifie signature et expiration. Ne dit pas si la session a été révoquée
 * depuis : c'est le rôle de `getSession()` (lib/auth.ts), qui interroge la base.
 * Cette fonction reste sans dépendance réseau pour rester utilisable dans le
 * proxy.
 */
export function openSession(token: string | undefined): SessionClaims | null {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, signFor("session", body))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.sv !== "number") return null;
    return {
      id: payload.id,
      name: payload.name,
      avatar: payload.avatar,
      version: payload.sv,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export async function readSessionCookie(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}
