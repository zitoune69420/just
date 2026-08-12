import { currentUser } from "@/lib/auth";
import { checkAccess } from "@/lib/entitlements";
import { getProgressFor } from "@/lib/progress";
import { allowByIp, MINUTE } from "@/lib/rate-limit";
import { FINISHED_RATIO } from "@/lib/resume";
import { openStreamTicket } from "@/lib/stream-ticket";
import { buildStreamUrl } from "@/lib/stream-url";
import { isSupabaseAdminConfigured } from "@/lib/supabase";

const QUOTA = { limit: 60, windowMs: MINUTE };

const HEADERS = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

function refuse(status: number): Response {
  return new Response(null, { status, headers: HEADERS });
}

/**
 * Ouverture du lecteur. Le client n'a jamais l'adresse du serveur de flux : il
 * suit ce lien, qui revérifie le laissez-passer, la session et les droits avant
 * de rediriger.
 *
 * Limite connue : la redirection expose l'adresse finale à qui inspecte le
 * trafic de son propre navigateur. Tant que le serveur de flux n'exige pas
 * lui-même un jeton signé, cette adresse reste rejouable. Le contrôle de quota
 * n'est donc complet que du côté de l'application.
 */
export async function GET(request: Request) {
  if (!(await allowByIp("stream", QUOTA))) return refuse(429);

  const ticket = openStreamTicket(
    new URL(request.url).searchParams.get("t"),
  );
  if (!ticket) return refuse(403);

  const url = buildStreamUrl(
    ticket.mediaType,
    ticket.tmdbId,
    ticket.season,
    ticket.episode,
  );
  if (!url) return refuse(503);

  if (!isSupabaseAdminConfigured()) {
    return Response.redirect(url, 302);
  }

  const user = await currentUser();
  if (!user || user.id !== ticket.userId) return refuse(403);

  let allowed: boolean;
  try {
    const decision = await checkAccess(
      user.id,
      user.role,
      ticket.mediaType,
      ticket.tmdbId,
    );
    allowed = decision.allowed;
  } catch {
    return refuse(503);
  }

  if (!allowed) return refuse(403);

  /**
   * La reprise est résolue ici, pas chez le client : une position venue du
   * navigateur serait à sa main, alors que celle-ci sort de la base. Un échec de
   * lecture ne coûte que la reprise, jamais la séance — on repart du début.
   */
  let startAt: number | null = null;
  try {
    const entry = await getProgressFor(
      user.id,
      ticket.mediaType,
      ticket.tmdbId,
    );
    /**
     * Une progression enregistrée sur un autre épisode ne dit rien de celui
     * qu'on ouvre : elle ne doit pas y être reportée.
     */
    /**
     * Trois conditions, et la reprise n'est tentée que si les trois tiennent.
     *
     * `positionExact` d'abord : le compteur de repli additionne du temps
     * d'ouverture, pas une position. Le servir à `startAt`, c'est demander au
     * lecteur de démarrer au-delà de la fin — il attend alors un segment
     * inexistant et tourne sans jamais démarrer.
     *
     * Une durée connue ensuite, puis une position franchement à l'intérieur :
     * sans repère de fin, rien ne garantit que le point demandé existe.
     */
    if (
      entry &&
      entry.positionExact &&
      entry.season === ticket.season &&
      entry.episode === ticket.episode &&
      entry.durationSeconds !== null &&
      entry.durationSeconds > 0
    ) {
      /**
       * Un titre déjà terminé repart du début : le relancer, c'est vouloir le
       * revoir, pas atterrir sur son générique de fin. Même seuil que la reprise
       * affichée sur la fiche, pour que les deux racontent la même chose.
       */
      const finished =
        entry.positionSeconds / entry.durationSeconds >= FINISHED_RATIO;

      if (!finished && entry.positionSeconds < entry.durationSeconds) {
        startAt = entry.positionSeconds;
      }
    }
  } catch {
    startAt = null;
  }

  const target =
    startAt === null
      ? url
      : (buildStreamUrl(
          ticket.mediaType,
          ticket.tmdbId,
          ticket.season,
          ticket.episode,
          startAt,
        ) ?? url);

  return new Response(null, {
    status: 302,
    headers: { ...HEADERS, Location: target },
  });
}
