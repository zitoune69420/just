import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  callbackUrl,
  type DiscordProfile,
  OAUTH_RETURN_COOKIE,
  OAUTH_STATE_COOKIE,
  signInWithCode,
} from "@/lib/discord";
import {
  getSession,
  sealSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import {
  DiscordTakenError,
  linkDiscordToUser,
  toSessionUser,
  upsertDiscordUser,
} from "@/lib/users";

function matches(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function clearFlowCookies(response: NextResponse): NextResponse {
  response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: "/api/auth" });
  response.cookies.delete({ name: OAUTH_RETURN_COOKIE, path: "/api/auth" });
  return response;
}

function failure(
  request: NextRequest,
  reason: string,
  path = "/login",
): NextResponse {
  return clearFlowCookies(
    NextResponse.redirect(
      new URL(`${path}?error=${reason}`, request.nextUrl.origin),
    ),
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get("error")) {
    return failure(request, "denied");
  }

  const code = params.get("code");
  const state = params.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || !matches(state, expectedState)) {
    return failure(request, "state");
  }

  let profile: DiscordProfile;
  try {
    profile = await signInWithCode(code, callbackUrl(request.url));
  } catch {
    return failure(request, "discord");
  }

  const session = await getSession();
  const errorPath = session ? "/account" : "/login";

  let token: string;
  try {
    if (!isSupabaseAdminConfigured()) {
      token = sealSession({
        id: profile.discordId,
        name: profile.name,
        avatar: profile.avatar,
      });
    } else if (session) {
      token = sealSession(
        toSessionUser(await linkDiscordToUser(session.id, profile)),
      );
    } else {
      token = sealSession(toSessionUser(await upsertDiscordUser(profile)));
    }
  } catch (error) {
    if (error instanceof DiscordTakenError) {
      return failure(request, "linked", errorPath);
    }
    return failure(request, "database", errorPath);
  }

  const returnTo = request.cookies.get(OAUTH_RETURN_COOKIE)?.value ?? "/";
  const response = clearFlowCookies(
    NextResponse.redirect(new URL(returnTo, request.nextUrl.origin)),
  );
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

  return response;
}
