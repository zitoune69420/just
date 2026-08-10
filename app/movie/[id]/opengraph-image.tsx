import { ImageResponse } from "next/og";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/components/og-card";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { toMovieDetails } from "@/lib/media";
import { getMovieDetails, isTmdbConfigured } from "@/lib/tmdb";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Fiche film sur JUST";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, t } = await getLocaleAndTranslator();
  const movie = isTmdbConfigured()
    ? await getMovieDetails(locale, Number(id))
    : null;

  if (!movie) {
    return new ImageResponse(
      <OgCard
        badge={t("media.movie")}
        title={t("notFound.title")}
        poster={null}
        backdrop={null}
      />,
      size,
    );
  }

  const details = toMovieDetails(movie, { locale, t });

  return new ImageResponse(
    (
      <OgCard
        badge={t("media.movie")}
        title={details.title}
        subtitle={details.facts.join(" · ")}
        poster={details.poster}
        backdrop={details.backdrop}
      />
    ),
    size,
  );
}
