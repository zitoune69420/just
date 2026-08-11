import { ImageResponse } from "next/og";
import { OgCard, OG_CONTENT_TYPE, OG_SIZE } from "@/components/og-card";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/translate";
import { getListBySlug, getListItems } from "@/lib/lists";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { getMediaSummary, isTmdbConfigured } from "@/lib/tmdb";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Liste partagée sur JUST";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { locale, t } = await getLocaleAndTranslator();

  /**
   * Aucune session ici : l'aperçu est demandé par des robots de réseaux
   * sociaux. On passe donc `null` comme lecteur, ce qui restreint l'image aux
   * listes publiques — une liste privée ne doit pas fuiter par sa vignette.
   */
  const list =
    isSupabaseAdminConfigured() && isTmdbConfigured()
      ? await getListBySlug(slug, null)
      : null;

  if (!list) {
    return new ImageResponse(
      <OgCard
        badge={t("lists.title")}
        title={t("lists.notFound")}
        poster={null}
        backdrop={null}
      />,
      size,
    );
  }

  const items = await getListItems(list.id);

  // La première affiche de la liste sert de visuel : c'est ce qui l'identifie.
  const first = items[0]
    ? await getMediaSummary(locale, items[0].mediaType, items[0].tmdbId)
    : null;

  const subtitle = [
    plural(t, "lists.count", items.length),
    list.ownerName ? t("lists.by", { name: list.ownerName }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <OgCard
        badge={t("lists.title")}
        title={list.title}
        subtitle={subtitle}
        poster={first?.poster_path ?? null}
        backdrop={first?.backdrop_path ?? null}
      />
    ),
    size,
  );
}
