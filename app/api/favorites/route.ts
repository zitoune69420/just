import { favoriteKey, type FavoritesPayload } from "@/lib/favorites";
import { getSession } from "@/lib/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { getWatchlist } from "@/lib/watchlist";

const NO_STORE = { headers: { "Cache-Control": "no-store" } };

function payload(signedIn: boolean, keys: string[]): Response {
  return Response.json({ signedIn, keys } satisfies FavoritesPayload, NO_STORE);
}

export async function GET() {
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
