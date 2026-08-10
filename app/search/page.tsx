import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@appica/ui-react/button";
import { ArrowLeft, Search, SearchOff } from "@appica/icons-react";
import { MediaCard } from "@/components/media-card";
import { MediaRow } from "@/components/media-row";
import { PersonCard } from "@/components/person-card";
import { PersonRow } from "@/components/person-row";
import { SearchForm } from "@/components/search-form";
import { SetupNotice } from "@/components/setup-notice";
import { GridSkeleton } from "@/components/skeletons";
import { getLocaleAndTranslator } from "@/lib/i18n/server";
import { plural, type Translate } from "@/lib/i18n/translate";
import { toMedia, toPerson } from "@/lib/media";
import { isTmdbConfigured, searchMedia, searchPeople } from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Search",
};

const GRID_CLASSES =
  "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

const GRID_SIZES = "(min-width: 1280px) 190px, (min-width: 640px) 30vw, 45vw";

/** Nombre de pages TMDB agrégées derrière « voir plus ». */
const FULL_VIEW_PAGES = 5;

type View = "titles" | "people" | null;

interface SearchParams {
  q?: string;
  view?: string;
}

function parseView(value: string | undefined): View {
  return value === "titles" || value === "people" ? value : null;
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  if (!isTmdbConfigured()) return <SetupNotice />;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<GridSkeleton />}>
        {searchParams.then((params) => (
          <SearchScreen
            query={(params.q ?? "").trim()}
            view={parseView(params.view)}
          />
        ))}
      </Suspense>
    </div>
  );
}

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
        <Icon size={30} />
      </div>
      <p className="text-lg font-medium text-foreground-strong">{title}</p>
      <p className="max-w-sm text-sm text-foreground-muted">{hint}</p>
    </div>
  );
}

function Header({ t, query }: { t: Translate; query: string }) {
  return (
    <header className="space-y-5">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("search.title")}
      </h1>
      <SearchForm initialQuery={query} />
    </header>
  );
}

function seeAllHref(query: string, view: Exclude<View, null>): string {
  return `/search?q=${encodeURIComponent(query)}&view=${view}`;
}

async function SearchScreen({ query, view }: { query: string; view: View }) {
  const { locale, t } = await getLocaleAndTranslator();

  if (!query) {
    return (
      <>
        <Header t={t} query={query} />
        <EmptyState
          icon={Search}
          title={t("search.prompt")}
          hint={t("search.promptHint")}
        />
      </>
    );
  }

  if (view) {
    return (
      <>
        <Header t={t} query={query} />
        <FullResults locale={locale} t={t} query={query} view={view} />
      </>
    );
  }

  const [data, peopleData] = await Promise.all([
    searchMedia(locale, query),
    searchPeople(locale, query),
  ]);

  const items = data.results.map((item) => toMedia(item));
  const people = peopleData.results
    .filter((item) => item.profile_path)
    .map((item) => toPerson(item, t));

  if (items.length === 0 && people.length === 0) {
    return (
      <>
        <Header t={t} query={query} />
        <EmptyState
          icon={SearchOff}
          title={t("search.noResults", { query })}
          hint={t("search.noResultsHint")}
        />
      </>
    );
  }

  return (
    <>
      <Header t={t} query={query} />
      <div className="enter space-y-12">
        <MediaRow
          title={plural(t, "search.titles", data.total_results, {
            count: data.total_results,
            query,
          })}
          items={items}
          moreHref={
            data.total_results > items.length
              ? seeAllHref(query, "titles")
              : undefined
          }
          moreLabel={t("search.seeAll")}
        />

        <PersonRow
          title={t("search.people")}
          people={people}
          moreHref={
            peopleData.total_results > people.length
              ? seeAllHref(query, "people")
              : undefined
          }
          moreLabel={t("search.seeAll")}
        />
      </div>
    </>
  );
}

/** Agrège plusieurs pages TMDB pour la vue « voir plus ». */
async function FullResults({
  locale,
  t,
  query,
  view,
}: {
  locale: Awaited<ReturnType<typeof getLocaleAndTranslator>>["locale"];
  t: Translate;
  query: string;
  view: Exclude<View, null>;
}) {
  const pages = Array.from({ length: FULL_VIEW_PAGES }, (_, index) => index + 1);

  const back = (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      render={<Link href={`/search?q=${encodeURIComponent(query)}`} />}
    >
      <ArrowLeft size={16} /> {t("search.backToResults")}
    </Button>
  );

  if (view === "people") {
    const responses = await Promise.all(
      pages.map((page) => searchPeople(locale, query, page)),
    );
    const people = responses
      .flatMap((response) => response.results)
      .filter((item) => item.profile_path)
      .map((item) => toPerson(item, t));

    return (
      <section className="enter space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {t("search.allPeople", { query })}
          </h2>
          {back}
        </div>
        <div className={GRID_CLASSES}>
          {people.map((person) => (
            <PersonCard key={person.id} person={person} sizes={GRID_SIZES} />
          ))}
        </div>
      </section>
    );
  }

  const responses = await Promise.all(
    pages.map((page) => searchMedia(locale, query, page)),
  );
  const items = responses
    .flatMap((response) => response.results)
    .map((item) => toMedia(item));

  return (
    <section className="enter space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          {t("search.allTitles", { query })}
        </h2>
        {back}
      </div>
      <div className={GRID_CLASSES}>
        {items.map((media) => (
          <MediaCard
            key={`${media.type}-${media.id}`}
            media={media}
            sizes={GRID_SIZES}
          />
        ))}
      </div>
    </section>
  );
}
