import { ImageResponse } from "next/og";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/components/og-card";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { toTvDetails } from "@/lib/media";
import { getTvDetails, isTmdbConfigured } from "@/lib/tmdb";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Fiche série sur JUST";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, t } = await getLocaleAndTranslator();
  const series = isTmdbConfigured()
    ? await getTvDetails(locale, Number(id))
    : null;

  if (!series) {
    return new ImageResponse(
      <OgCard
        badge={t("media.tv")}
        title={t("notFound.title")}
        poster={null}
        backdrop={null}
      />,
      size,
    );
  }

  const details = toTvDetails(series, { locale, t });

  return new ImageResponse(
    (
      <OgCard
        badge={t("media.tv")}
        title={details.title}
        subtitle={details.facts.join(" · ")}
        poster={details.poster}
        backdrop={details.backdrop}
      />
    ),
    size,
  );
}
