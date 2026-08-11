import { safeEqual, signFor } from "./session";
import type { MediaType } from "./types";

/**
 * Laissez-passer de lecture : lien à usage immédiat, signé, lié à un compte et
 * à un titre précis. Le client ne reçoit plus l'URL du serveur de flux, il
 * reçoit `/api/stream?t=…`, que le serveur revalide avant de rediriger.
 */
export interface StreamTicket {
  userId: string;
  mediaType: MediaType;
  tmdbId: number;
  season: number | null;
  episode: number | null;
}

interface TicketPayload {
  u: string;
  m: MediaType;
  i: number;
  s: number | null;
  e: number | null;
  x: number;
}

/** Le laissez-passer ne sert qu'à ouvrir le lecteur juste après le clic. */
export const TICKET_TTL_MS = 2 * 60 * 1000;

const NAMESPACE = "stream-ticket";

export function signStreamTicket(ticket: StreamTicket): string {
  const payload: TicketPayload = {
    u: ticket.userId,
    m: ticket.mediaType,
    i: ticket.tmdbId,
    s: ticket.season,
    e: ticket.episode,
    x: Date.now() + TICKET_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signFor(NAMESPACE, body)}`;
}

export function openStreamTicket(
  token: string | undefined | null,
): StreamTicket | null {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const body = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, signFor(NAMESPACE, body))) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as TicketPayload;

    if (typeof payload.x !== "number" || payload.x < Date.now()) return null;
    if (typeof payload.u !== "string" || !payload.u) return null;
    if (payload.m !== "movie" && payload.m !== "tv") return null;
    if (!Number.isInteger(payload.i) || payload.i < 1) return null;

    return {
      userId: payload.u,
      mediaType: payload.m,
      tmdbId: payload.i,
      season: typeof payload.s === "number" ? payload.s : null,
      episode: typeof payload.e === "number" ? payload.e : null,
    };
  } catch {
    return null;
  }
}
