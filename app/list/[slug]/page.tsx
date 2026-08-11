import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@appica/ui-react/badge";
import { MediaCard } from "@/components/media-card";
import { GridSkeleton } from "@/components/skeletons";
import { getSession } from "@/lib/auth";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { toMedia } from "@/lib/media";
import { getListBySlug, getListItems } from "@/lib/lists";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { getMediaSummary, isTmdbConfigured } from "@/lib/tmdb";
import type { Media } from "@/lib/types";

const GRID_SIZES = "(min-width: 1280px) 190px, (min-width: 768px) 22vw, 45vw";

type PageProps = { params: Promise<{ slug: string }> };

/** Le lecteur d'un lien partagé n'est pas forcément connecté. */
async function viewerId(): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const session = await getSession();
  return session?.id ?? null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  if (!isSupabaseAdminConfigured()) return {};

  const { slug } = await params;
  const list = await getListBySlug(slug, await viewerId());
  if (!list) return {};

  const description = list.description ?? undefined;
  return {
    title: list.title,
    description,
    openGraph: { title: list.title, description, type: "website" },
  };
}

export default function ListPage({ params }: PageProps) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<GridSkeleton count={6} />}>
        {params.then(({ slug }) => (
          <ListContent slug={slug} />
        ))}
      </Suspense>
    </div>
  );
}

async function ListContent({ slug }: { slug: string }) {
  if (!isSupabaseAdminConfigured() || !isTmdbConfigured()) notFound();

  const { locale, t } = await getLocaleAndTranslator();

  /**
   * `getListBySlug` renvoie `null` aussi bien pour une liste inexistante que
   * pour une liste privée dont on n'est pas l'auteur : de l'extérieur, les deux
   * cas doivent être indiscernables, sinon l'adresse trahit son existence.
   */
  const list = await getListBySlug(slug, await viewerId());
  if (!list) notFound();

  const items = await getListItems(list.id);

  const header = (
    <header className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {list.title}
        </h1>
        {!list.isPublic && (
          <Badge variant="soft" size="sm" className="rounded-full">
            {t("lists.private")}
          </Badge>
        )}
      </div>
      {list.description && (
        <p className="max-w-2xl text-sm text-foreground-muted">
          {list.description}
        </p>
      )}
      {list.ownerName && (
        <p className="text-xs text-foreground-subtle">
          {t("lists.by", { name: list.ownerName })}
        </p>
      )}
    </header>
  );

  if (items.length === 0) {
    return (
      <>
        {header}
        <p className="py-20 text-center text-sm text-foreground-muted">
          {t("lists.emptyList")}
        </p>
      </>
    );
  }

  const summaries = await Promise.all(
    items.map((item) => getMediaSummary(locale, item.mediaType, item.tmdbId)),
  );

  const media = summaries
    .map((summary, index) =>
      summary ? toMedia(summary, items[index].mediaType) : null,
    )
    .filter((entry): entry is Media => entry !== null);

  return (
    <>
      {header}
      <div className="enter grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {media.map((entry) => (
          <MediaCard
            key={`${entry.type}-${entry.id}`}
            media={entry}
            sizes={GRID_SIZES}
          />
        ))}
      </div>
    </>
  );
}
