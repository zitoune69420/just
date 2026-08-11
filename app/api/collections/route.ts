import { getSession } from "@/lib/auth";
import {
  collectionItemKey,
  type CollectionsPayload,
} from "@/lib/collections";
import { allowByIp, MINUTE, tooManyRequests } from "@/lib/rate-limit";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { getCollections } from "@/lib/watchlist";

const NO_STORE = { headers: { "Cache-Control": "no-store" } };

const EMPTY = { favorite: [], watchlist: [] };

function payload(
  signedIn: boolean,
  keys: CollectionsPayload["keys"],
): Response {
  return Response.json({ signedIn, keys } satisfies CollectionsPayload, NO_STORE);
}

const QUOTA = { limit: 60, windowMs: MINUTE };

export async function GET() {
  if (!(await allowByIp("collections", QUOTA))) return tooManyRequests(MINUTE);

  const user = await getSession();
  if (!user) return payload(false, EMPTY);
  if (!isSupabaseAdminConfigured()) return payload(true, EMPTY);

  try {
    const collections = await getCollections(user.id);
    return payload(true, {
      favorite: collections.favorite.map((entry) =>
        collectionItemKey(entry.mediaType, entry.tmdbId),
      ),
      watchlist: collections.watchlist.map((entry) =>
        collectionItemKey(entry.mediaType, entry.tmdbId),
      ),
    });
  } catch {
    return payload(true, EMPTY);
  }
}
