import { currentUser } from "@/lib/auth";
import { checkAccess } from "@/lib/entitlements";
import { allowByIp, MINUTE } from "@/lib/rate-limit";
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

  return new Response(null, {
    status: 302,
    headers: { ...HEADERS, Location: url },
  });
}
