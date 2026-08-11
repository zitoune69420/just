import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  authorizeUrl,
  callbackUrl,
  isDiscordConfigured,
  OAUTH_RETURN_COOKIE,
  OAUTH_STATE_COOKIE,
} from "@/lib/discord";
import { allowByIp, MINUTE } from "@/lib/rate-limit";
import { safeInternalPath } from "@/lib/redirects";

const STATE_MAX_AGE = 60 * 10;

const QUOTA = { limit: 20, windowMs: 10 * MINUTE };

function refererPath(request: NextRequest): string | null {
  const referer = request.headers.get("referer");
  if (!referer) return null;
  try {
    const url = new URL(referer);
    if (url.origin !== request.nextUrl.origin) return null;
    if (url.pathname.startsWith("/api/auth") || url.pathname === "/login")
      return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!(await allowByIp("discord-authorize", QUOTA))) {
    return new Response(null, { status: 429, headers: { "Retry-After": "60" } });
  }

  if (!isDiscordConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=config", request.nextUrl.origin),
    );
  }

  const state = randomBytes(32).toString("base64url");
  const returnTo =
    safeInternalPath(request.nextUrl.searchParams.get("returnTo")) ??
    refererPath(request) ??
    "/";
  const response = NextResponse.redirect(
    authorizeUrl(state, callbackUrl(request.url)),
  );

  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: STATE_MAX_AGE,
  };
  response.cookies.set(OAUTH_STATE_COOKIE, state, options);
  response.cookies.set(OAUTH_RETURN_COOKIE, returnTo, options);

  return response;
}
