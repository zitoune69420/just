import { consumeAccess, type AccessDecision } from "@/lib/entitlements";
import { isMediaType, isTmdbId } from "@/lib/favorites";
import { getSession } from "@/lib/session";
import { buildStreamUrl } from "@/lib/stream-url";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { findUserById } from "@/lib/users";

interface PlaybackBody {
  mediaType?: unknown;
  tmdbId?: unknown;
  season?: unknown;
  episode?: unknown;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function denied(decision: Extract<AccessDecision, { allowed: false }>) {
  return Response.json(
    { reason: decision.reason, limit: decision.limit },
    { status: 403 },
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ reason: "anonymous", limit: 0 }, { status: 401 });
  }

  let body: PlaybackBody;
  try {
    body = (await request.json()) as PlaybackBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  const { mediaType, tmdbId } = body;
  if (!isMediaType(mediaType) || !isTmdbId(tmdbId)) {
    return new Response(null, { status: 400 });
  }

  const season = mediaType === "tv" ? positiveInteger(body.season) : null;
  const episode = mediaType === "tv" ? positiveInteger(body.episode) : null;

  const url = buildStreamUrl(mediaType, tmdbId, season, episode);
  if (!url) {
    return Response.json({ reason: "unavailable", limit: 0 }, { status: 503 });
  }

  if (!isSupabaseAdminConfigured()) {
    return Response.json({ url });
  }

  let decision: AccessDecision;
  try {
    const user = await findUserById(session.id);
    if (!user) {
      return Response.json({ reason: "anonymous", limit: 0 }, { status: 401 });
    }
    decision = await consumeAccess(user.id, user.role, mediaType, tmdbId);
  } catch {
    return Response.json({ reason: "database", limit: 0 }, { status: 503 });
  }

  if (!decision.allowed) {
    return denied(decision);
  }

  return Response.json({ url, remaining: decision.remaining });
}
