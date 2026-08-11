import { favoriteKey, type FavoritesPayload } from "@/lib/favorites";
import { getSession } from "@/lib/auth";
import { allowByIp, MINUTE, tooManyRequests } from "@/lib/rate-limit";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { getWatchlist } from "@/lib/watchlist";

const NO_STORE = { headers: { "Cache-Control": "no-store" } };

function payload(signedIn: boolean, keys: string[]): Response {
  return Response.json({ signedIn, keys } satisfies FavoritesPayload, NO_STORE);
}

const QUOTA = { limit: 60, windowMs: MINUTE };

export async function GET() {
  if (!(await allowByIp("favorites", QUOTA))) return tooManyRequests(MINUTE);

  const user = await getSession();
  if (!user) return payload(false, []);
  if (!isSupabaseAdminConfigured()) return payload(true, []);

  try {
    const entries = await getWatchlist(user.id);
    return payload(
      true,
      entries.map((entry) => favoriteKey(entry.mediaType, entry.tmdbId)),
    );
  } catch {
    return payload(true, []);
  }
}
