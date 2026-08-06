import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "just_session_v2";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export interface SessionUser {
  id: string;
  name: string;
  avatar: string | null;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

export function hasSessionSecret(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

function sessionSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "AUTH_SECRET manquante. Ajoutez-la dans .env.local (voir .env.example).",
    );
  }
  return secret;
}

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function sealSession(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function openSession(token: string | undefined): SessionUser | null {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, sign(body))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { id: payload.id, name: payload.name, avatar: payload.avatar };
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

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  try {
    return openSession(token);
  } catch {
    return null;
  }
}
