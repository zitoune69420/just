import { NextResponse, type NextRequest } from "next/server";
import { openSession, SESSION_COOKIE } from "@/lib/session";

/**
 * Le catalogue se visite sans compte : la connexion ne conditionne pas la
 * navigation, seulement la lecture. Celle-ci est refusée côté serveur par
 * `/api/playback` et `/api/stream`, qui vérifient session et droits — ce sont
 * eux le verrou, pas ce fichier.
 *
 * Restent ici les routes qui n'ont aucun sens sans compte et dont on préfère
 * qu'elles n'apparaissent jamais, même une fraction de seconde. Les pages
 * personnelles (`/favorites`, `/watchlist`, `/history`, `/lists`, `/account`)
 * n'en font pas partie : elles affichent d'elles-mêmes une invitation à se
 * connecter, ce qui vaut mieux qu'une redirection sèche.
 */
const PRIVATE_PATHS = ["/admin"];

function isPrivate(pathname: string): boolean {
  return PRIVATE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isPrivate(pathname)) {
    return NextResponse.next();
  }

  let signedIn = false;
  try {
    signedIn = openSession(request.cookies.get(SESSION_COOKIE)?.value) !== null;
  } catch {
    signedIn = false;
  }

  if (signedIn) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.nextUrl.origin);
  login.searchParams.set("returnTo", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
