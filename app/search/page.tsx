import type { Metadata } from "next";
import { Suspense } from "react";
import { Search, SearchOff } from "@appica/icons-react";
import { MediaCard } from "@/components/media-card";
import { SearchForm } from "@/components/search-form";
import { SetupNotice } from "@/components/setup-notice";
import { GridSkeleton } from "@/components/skeletons";
import { toMedia } from "@/lib/media";
import { isTmdbConfigured, searchMedia } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Recherche",
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-5">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Recherche
        </h1>
        <Suspense>
          {searchParams.then(({ q }) => (
            <SearchForm initialQuery={(q ?? "").trim()} />
          ))}
        </Suspense>
      </header>
      <Suspense fallback={<GridSkeleton />}>
        {searchParams.then(({ q }) => (
          <SearchResults query={(q ?? "").trim()} />
        ))}
      </Suspense>
    </div>
  );
}

/** État vide : une icône, une phrase, et rien qui prétende être un résultat. */
function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ElementType;
  title: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="enter flex flex-col items-center gap-3 py-20 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-background-muted text-foreground-subtle">
        <Icon size={24} />
      </div>
      <p className="text-lg font-medium text-foreground-strong">{title}</p>
      <p className="max-w-sm text-sm text-foreground-muted">{hint}</p>
    </div>
  );
}

async function SearchResults({ query }: { query: string }) {
  if (!query) {
    return (
      <EmptyState
        icon={Search}
        title="Que cherchez-vous ?"
        hint="Tapez le titre d’un film ou d’une série pour lancer la recherche."
      />
    );
  }

  const data = await searchMedia(query);
  const items = data.results.map((item) => toMedia(item));

  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchOff}
        title={<>Aucun résultat pour «&nbsp;{query}&nbsp;»</>}
        hint="Vérifiez l’orthographe, ou essayez le titre original."
      />
    );
  }

  return (
    <section className="enter space-y-6">
      <h2 className="text-sm font-medium text-foreground-muted">
        {data.total_results} résultat{data.total_results > 1 ? "s" : ""} pour
        «&nbsp;{query}&nbsp;»
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((media) => (
          <MediaCard
            key={`${media.type}-${media.id}`}
            media={media}
            sizes="(min-width: 1280px) 190px, (min-width: 640px) 30vw, 45vw"
          />
        ))}
      </div>
    </section>
  );
}
