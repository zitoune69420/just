import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { HeartOff } from "@appica/icons-react";
import { DiscordSignInButton } from "@/components/discord-sign-in";
import { MediaCard } from "@/components/media-card";
import { GridSkeleton } from "@/components/skeletons";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { toMedia } from "@/lib/media";
import { getSession } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { getMediaSummary, isTmdbConfigured } from "@/lib/tmdb";
import { getWatchlist } from "@/lib/watchlist";
import type { Media } from "@/lib/types";

export const metadata: Metadata = {
  title: "Favorites",
};

const GRID_SIZES = "(min-width: 1280px) 190px, (min-width: 768px) 22vw, 45vw";

export default function FavoritesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<GridSkeleton count={6} />}>
        <FavoritesContent />
      </Suspense>
    </div>
  );
}

function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-background-muted text-foreground-subtle">
        <HeartOff size={30} />
      </div>
      <p className="text-lg font-medium text-foreground-strong">{title}</p>
      <p className="max-w-sm text-sm text-foreground-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

async function FavoritesContent() {
  const { locale, t } = await getLocaleAndTranslator();
  const user = await getSession();

  const header = (
    <header className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("favorites.title")}
      </h1>
      <p className="text-sm text-foreground-muted">
        {t("favorites.descriptionLong")}
      </p>
    </header>
  );

  if (!user) {
    return (
      <>
        {header}
        <Empty
          title={t("favorites.signInRequired")}
          description={t("favorites.signInHint")}
          action={
            <DiscordSignInButton
              label={t("auth.discord")}
              returnTo="/favorites"
            />
          }
        />
      </>
    );
  }

  if (!isSupabaseAdminConfigured() || !isTmdbConfigured()) {
    return (
      <>
        {header}
        <div className="max-w-lg space-y-4 rounded-3xl border border-border bg-background-subtle p-8">
          <Badge variant="soft" className="rounded-full">
            {t("favorites.configRequired")}
          </Badge>
          <p className="text-sm text-foreground-muted">
            {t("favorites.configHint")}
          </p>
        </div>
      </>
    );
  }

  const entries = await getWatchlist(user.id);

  if (entries.length === 0) {
    return (
      <>
        {header}
        <Empty
          title={t("favorites.empty")}
          description={t("favorites.emptyHint")}
          action={
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              render={<Link href="/movies" />}
            >
              {t("favorites.browse")}
            </Button>
          }
        />
      </>
    );
  }

  const summaries = await Promise.all(
    entries.map((entry) => getMediaSummary(locale, entry.mediaType, entry.tmdbId)),
  );

  const items = summaries
    .map((summary, index) =>
      summary ? toMedia(summary, entries[index].mediaType) : null,
    )
    .filter((media): media is Media => media !== null);

  if (items.length === 0) {
    return (
      <>
        {header}
        <Empty
          title={t("favorites.missing")}
          description={t("favorites.missingHint")}
        />
      </>
    );
  }

  return (
    <>
      {header}
      <div className="enter grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((media) => (
          <MediaCard
            key={`${media.type}-${media.id}`}
            media={media}
            sizes={GRID_SIZES}
          />
        ))}
      </div>
    </>
  );
}
