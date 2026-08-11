import Link from "next/link";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { getSession } from "@/lib/auth";
import type { CollectionKind } from "@/lib/collections";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";
import { toMedia } from "@/lib/media";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { getMediaSummary, isTmdbConfigured } from "@/lib/tmdb";
import type { Media } from "@/lib/types";
import { getCollection } from "@/lib/watchlist";
import { DiscordSignInButton } from "./discord-sign-in";
import { MediaCard } from "./media-card";

const GRID_SIZES = "(min-width: 1280px) 190px, (min-width: 768px) 22vw, 45vw";

/**
 * Les deux listes d'un compte affichent la même page à l'identique : seuls le
 * `kind` lu en base, le préfixe de traduction et l'icône du vide changent.
 */
type Prefix = "favorites" | "watchlist";

function Empty({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-background-muted text-foreground-subtle">
        {icon}
      </div>
      <p className="text-lg font-medium text-foreground-strong">{title}</p>
      <p className="max-w-sm text-sm text-foreground-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export async function CollectionPage({
  kind,
  prefix,
  path,
  icon,
}: {
  kind: CollectionKind;
  prefix: Prefix;
  path: string;
  icon: React.ReactNode;
}) {
  const { locale, t } = await getLocaleAndTranslator();
  const user = await getSession();

  const key = (name: string) => `${prefix}.${name}` as MessageKey;

  const header = (
    <header className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t(key("title"))}
      </h1>
      <p className="text-sm text-foreground-muted">
        {t(key("descriptionLong"))}
      </p>
    </header>
  );

  if (!user) {
    return (
      <>
        {header}
        <Empty
          icon={icon}
          title={t(key("signInRequired"))}
          description={t(key("signInHint"))}
          action={
            <DiscordSignInButton label={t("auth.discord")} returnTo={path} />
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
            {t(key("configRequired"))}
          </Badge>
          <p className="text-sm text-foreground-muted">{t(key("configHint"))}</p>
        </div>
      </>
    );
  }

  const entries = await getCollection(user.id, kind);

  if (entries.length === 0) {
    return (
      <>
        {header}
        <Empty
          icon={icon}
          title={t(key("empty"))}
          description={t(key("emptyHint"))}
          action={
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              render={<Link href="/catalog/movies" />}
            >
              {t(key("browse"))}
            </Button>
          }
        />
      </>
    );
  }

  const summaries = await Promise.all(
    entries.map((entry) =>
      getMediaSummary(locale, entry.mediaType, entry.tmdbId),
    ),
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
          icon={icon}
          title={t(key("missing"))}
          description={t(key("missingHint"))}
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
