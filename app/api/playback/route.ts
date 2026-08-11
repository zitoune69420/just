import { currentUser, getSession } from "@/lib/auth";
import { consumeAccess, type AccessDecision } from "@/lib/entitlements";
import { isMediaType, isTmdbId } from "@/lib/collections";
import { allowByIpShared, MINUTE } from "@/lib/rate-limit";
import { signStreamTicket } from "@/lib/stream-ticket";
import { isStreamConfigured } from "@/lib/stream-url";
import { isSupabaseAdminConfigured } from "@/lib/supabase";

const QUOTA = { limit: 30, windowMs: MINUTE };

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
  if (!(await allowByIpShared("playback", QUOTA))) {
    return new Response(null, { status: 429, headers: { "Retry-After": "60" } });
  }

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

  if (!isStreamConfigured() || (mediaType === "tv" && (!season || !episode))) {
    return Response.json({ reason: "unavailable", limit: 0 }, { status: 503 });
  }

  /**
   * Le client reçoit un laissez-passer à courte durée, pas l'adresse du flux :
   * elle n'est plus devinable en changeant l'identifiant TMDB.
   */
  function ticketUrl(userId: string): string {
    return `/api/stream?t=${encodeURIComponent(
      signStreamTicket({
        userId,
        mediaType: mediaType as "movie" | "tv",
        tmdbId: tmdbId as number,
        season,
        episode,
      }),
    )}`;
  }

  if (!isSupabaseAdminConfigured()) {
    return Response.json({ url: ticketUrl(session.id) });
  }

  let decision: AccessDecision;
  let userId: string;
  try {
    const user = await currentUser();
    if (!user) {
      return Response.json({ reason: "anonymous", limit: 0 }, { status: 401 });
    }
    userId = user.id;
    decision = await consumeAccess(user.id, user.role, mediaType, tmdbId);
  } catch {
    return Response.json({ reason: "database", limit: 0 }, { status: 503 });
  }

  if (!decision.allowed) {
    return denied(decision);
  }

  return Response.json({
    url: ticketUrl(userId),
    remaining: decision.remaining,
  });
}
