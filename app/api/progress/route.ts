import { isMediaType, isTmdbId } from "@/lib/collections";
import { advanceProgress, setProgress } from "@/lib/progress";
import { getSession } from "@/lib/auth";
import {
  allowByIp,
  allowByUser,
  MINUTE,
  tooManyRequests,
} from "@/lib/rate-limit";
import { isSupabaseAdminConfigured } from "@/lib/supabase";

const MAX_TICK_SECONDS = 180;

const MAX_DURATION_SECONDS = 60 * 60 * 12;

interface TickBody {
  mediaType?: unknown;
  tmdbId?: unknown;
  season?: unknown;
  episode?: unknown;
  seconds?: unknown;
  positionSeconds?: unknown;
  durationSeconds?: unknown;
}

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

/**
 * Position rapportée par le lecteur. Zéro est une valeur légitime — un titre
 * repris depuis le début — donc elle ne passe pas par `positiveInteger`, qui
 * refuse zéro à dessein pour les compteurs.
 */
function seekPosition(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.min(Math.round(value), MAX_DURATION_SECONDS);
}

const QUOTA = { limit: 60, windowMs: MINUTE };

/**
 * Le client annonce lui-même le temps écoulé. Un compte ne peut donc pas gonfler
 * son historique plus vite qu'un lecteur réel : un tick couvre au plus
 * `MAX_TICK_SECONDS`, et on n'en accepte qu'un nombre borné par minute.
 */
const USER_QUOTA = { limit: 12, windowMs: MINUTE };

export async function POST(request: Request) {
  if (!(await allowByIp("progress", QUOTA))) return tooManyRequests(MINUTE);

  if (!isSupabaseAdminConfigured()) {
    return new Response(null, { status: 204 });
  }

  const user = await getSession();
  if (!user) {
    return new Response(null, { status: 204 });
  }

  if (!allowByUser("progress", user.id, USER_QUOTA)) {
    return tooManyRequests(MINUTE);
  }

  let body: TickBody;
  try {
    body = (await request.json()) as TickBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  const { mediaType, tmdbId } = body;
  if (!isMediaType(mediaType) || !isTmdbId(tmdbId)) {
    return new Response(null, { status: 400 });
  }

  const duration = positiveInteger(body.durationSeconds);
  const capped =
    duration !== null ? Math.min(duration, MAX_DURATION_SECONDS) : null;

  const season = mediaType === "tv" ? positiveInteger(body.season) : null;
  const episode = mediaType === "tv" ? positiveInteger(body.episode) : null;

  /**
   * Deux sources, dans cet ordre : la position exacte du lecteur quand il l'a
   * émise, sinon le temps écoulé mesuré par la fenêtre. La seconde ne sert plus
   * que de repli — un lecteur muet, ou un navigateur qui a coupé la fenêtre
   * avant le premier événement.
   */
  const position = seekPosition(body.positionSeconds);

  if (position !== null) {
    try {
      await setProgress(user.id, {
        tmdbId,
        mediaType,
        season,
        episode,
        /** Une position au-delà de la durée annoncée ne veut rien dire. */
        positionSeconds: capped !== null ? Math.min(position, capped) : position,
        durationSeconds: capped,
      });
    } catch {
      return new Response(null, { status: 503 });
    }

    return new Response(null, { status: 204 });
  }

  const seconds = positiveInteger(body.seconds);
  if (seconds === null) {
    return new Response(null, { status: 400 });
  }

  try {
    await advanceProgress(user.id, {
      tmdbId,
      mediaType,
      season,
      episode,
      seconds: Math.min(seconds, MAX_TICK_SECONDS),
      durationSeconds: capped,
    });
  } catch {
    return new Response(null, { status: 503 });
  }

  return new Response(null, { status: 204 });
}
