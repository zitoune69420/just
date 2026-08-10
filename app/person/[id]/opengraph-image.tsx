import { ImageResponse } from "next/og";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/components/og-card";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { toPersonDetails } from "@/lib/media";
import { getPersonDetails, isTmdbConfigured } from "@/lib/tmdb";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Fiche personne sur JUST";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { locale, t } = await getLocaleAndTranslator();
  const found = isTmdbConfigured()
    ? await getPersonDetails(locale, Number(id))
    : null;

  if (!found) {
    return new ImageResponse(
      <OgCard
        badge={t("media.person")}
        title={t("person.notFound")}
        poster={null}
        backdrop={null}
      />,
      size,
    );
  }

  const person = toPersonDetails(found, { locale, t });

  return new ImageResponse(
    (
      <OgCard
        round
        badge={person.department ?? t("media.person")}
        title={person.name}
        subtitle={person.known
          .slice(0, 3)
          .map((media) => media.title)
          .join(" · ")}
        poster={person.profile}
        backdrop={person.known[0]?.backdrop ?? null}
      />
    ),
    size,
  );
}
