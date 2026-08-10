import { ImageResponse } from "next/og";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/components/og-card";
import { getLocale } from "@/lib/i18n/server";
import { toMedia } from "@/lib/media";
import { getTrending, isTmdbConfigured } from "@/lib/tmdb";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "JUST — Films & Séries";

/** Affiche du titre le plus tendance, à défaut un visuel neutre. */
async function highlight() {
  if (!isTmdbConfigured()) return null;
  try {
    const trending = await getTrending(await getLocale());
    const first = trending.find((item) => item.poster_path);
    return first ? toMedia(first) : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const featured = await highlight();

  return new ImageResponse(
    (
      <OgCard
        badge="Films & séries"
        title="JUST"
        subtitle="Tendances, bandes-annonces, casting et recommandations."
        poster={featured?.poster ?? null}
        backdrop={featured?.backdrop ?? null}
      />
    ),
    size,
  );
}
