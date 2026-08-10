import Image from "next/image";
import { Badge } from "@appica/ui-react/badge";
import { UserOff } from "@appica/icons-react";
import { getTranslator } from "@/lib/i18n/server";
import { tmdbImage } from "@/lib/media";
import type { PersonDetails } from "@/lib/types";
import { MediaCard } from "./media-card";
import { MediaRow } from "./media-row";

const GRID_SIZES = "(min-width: 1280px) 190px, (min-width: 768px) 22vw, 45vw";

const FILMOGRAPHY_LIMIT = 36;

export async function PersonDetailView({
  person,
}: {
  person: PersonDetails;
}) {
  const t = await getTranslator();

  return (
    <article className="enter mx-auto w-full max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-8">
        <div className="relative aspect-2/3 w-40 shrink-0 overflow-hidden rounded-3xl bg-background-muted shadow-2xl ring-1 ring-border/60 sm:w-56">
          {person.profile ? (
            <Image
              src={tmdbImage(person.profile, "w500")}
              alt={t("person.portrait", { name: person.name })}
              fill
              priority
              sizes="(min-width: 640px) 224px, 160px"
              className="object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center text-foreground-subtle">
              <UserOff size={44} />
            </div>
          )}
        </div>

        <div className="max-w-2xl space-y-4 pb-1">
          {person.department && (
            <Badge variant="soft" size="sm" className="rounded-full">
              {person.department}
            </Badge>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl sm:tracking-[-0.03em]">
            {person.name}
          </h1>
          {person.facts.length > 0 && (
            <p className="text-sm text-foreground-muted">
              {person.facts.join(" · ")}
            </p>
          )}
        </div>
      </header>

      {person.biography && (
        <section className="max-w-3xl space-y-3">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {t("person.biography")}
          </h2>
          <p className="text-[15px]/7 whitespace-pre-line text-foreground-muted">
            {person.biography}
          </p>
        </section>
      )}

      {person.known.length > 0 && <MediaRow title={t("person.knownFor")} items={person.known} />}

      {person.filmography.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {t("person.filmography")}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {person.filmography.slice(0, FILMOGRAPHY_LIMIT).map((media) => (
              <MediaCard
                key={`${media.type}-${media.id}`}
                media={media}
                sizes={GRID_SIZES}
              />
            ))}
          </div>
        </section>
      )}

      {person.crew.length > 0 && (
        <MediaRow title={t("person.crew")} items={person.crew.slice(0, 20)} />
      )}
    </article>
  );
}
