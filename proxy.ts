import { NextResponse, type NextRequest } from "next/server";
import { openSession, SESSION_COOKIE } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

/**
 * Images de métadonnées générées (`/opengraph-image`, `/movie/12/twitter-image`…).
 * Elles n'ont pas d'extension dans l'URL, donc le matcher ne les écarte pas :
 * sans cette exception les robots des réseaux sociaux reçoivent la page de
 * connexion à la place de l'aperçu. Elles n'exposent que des données TMDB.
 */
const METADATA_IMAGE = /(^|\/)(opengraph|twitter)-image$/;

function isPublic(pathname: string): boolean {
  if (METADATA_IMAGE.test(pathname)) return true;
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublic(pathname)) {
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
  if (pathname !== "/") {
    login.searchParams.set("returnTo", `${pathname}${search}`);
  }
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)",
  ],
};
