"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Checkbox } from "@appica/ui-react/checkbox";
import { Separator } from "@appica/ui-react/separator";
import {
  ArrowsSort,
  ChevronDown,
  LayoutGrid,
  Tags,
} from "@appica/icons-react";
import type { SortKey } from "@/lib/tmdb";
import type { TmdbGenre } from "@/lib/types";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popularity", label: "Popularité" },
  { value: "rating", label: "Mieux notés" },
  { value: "year", label: "Plus récents" },
  { value: "title", label: "A-Z" },
];

const TYPE_ITEMS = [
  { basePath: "/movies", label: "Films" },
  { basePath: "/series", label: "Séries" },
] as const;

interface CatalogFiltersProps {
  basePath: "/movies" | "/series";
  genres: TmdbGenre[];
  selectedGenreIds: number[];
  sort: SortKey;
}

function buildHref(
  basePath: string,
  genreIds: number[],
  sort: SortKey,
): string {
  const params = new URLSearchParams();
  if (genreIds.length > 0) params.set("genres", genreIds.join(","));
  if (sort !== "popularity") params.set("sort", sort);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function CatalogFilters({
  basePath,
  genres,
  selectedGenreIds,
  sort,
}: CatalogFiltersProps) {
  const router = useRouter();
  const [typesOpen, setTypesOpen] = useState(true);
  const [sortOpen, setSortOpen] = useState(true);
  const [genresOpen, setGenresOpen] = useState(true);

  const hasActiveFilters = selectedGenreIds.length > 0 || sort !== "popularity";

  function toggleGenre(genreId: number) {
    const next = selectedGenreIds.includes(genreId)
      ? selectedGenreIds.filter((id) => id !== genreId)
      : [...selectedGenreIds, genreId];
    router.push(buildHref(basePath, next, sort));
  }

  return (
    <aside className="no-scrollbar h-[80vh] w-full rounded-3xl border border-border/60 bg-background-subtle/60 p-5 backdrop-blur-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto">
      <div className="flex items-center justify-between">
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => router.push(basePath)}
            className="text-xs text-foreground-muted transition-colors hover:text-foreground-strong"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <FilterSection
        icon={LayoutGrid}
        title="Catégories"
        open={typesOpen}
        onOpenChange={setTypesOpen}
      >
        {TYPE_ITEMS.map((item) => (
          <FilterCheckboxRow
            key={item.basePath}
            id={`type-${item.basePath}`}
            label={item.label}
            checked={item.basePath === basePath}
            onCheckedChange={() => {
              if (item.basePath !== basePath) {
                // Les ids de genres diffèrent entre films et séries : on ne garde que le tri.
                router.push(buildHref(item.basePath, [], sort));
              }
            }}
          />
        ))}
      </FilterSection>

      <Separator className="my-4 opacity-0" />

      <FilterSection
        icon={ArrowsSort}
        title="Trier par"
        open={sortOpen}
        onOpenChange={setSortOpen}
      >
        {SORT_OPTIONS.map((option) => (
          <FilterCheckboxRow
            key={option.value}
            id={`sort-${option.value}`}
            label={option.label}
            checked={sort === option.value}
            onCheckedChange={() => {
              router.push(buildHref(basePath, selectedGenreIds, option.value));
            }}
          />
        ))}
      </FilterSection>

      <Separator className="my-4 opacity-0" />

      <FilterSection
        icon={Tags}
        title="Genres"
        open={genresOpen}
        onOpenChange={setGenresOpen}
      >
        {genres.map((genre) => (
          <FilterCheckboxRow
            key={genre.id}
            id={`genre-${genre.id}`}
            label={genre.name}
            checked={selectedGenreIds.includes(genre.id)}
            onCheckedChange={() => toggleGenre(genre.id)}
          />
        ))}
      </FilterSection>
    </aside>
  );
}

function FilterSection({
  icon: Icon,
  title,
  open,
  onOpenChange,
  children,
}: {
  icon: React.ElementType;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between border-b border-border/60 pb-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2">
          <Icon size={20} className="text-foreground-muted" />
          <span className="text-sm font-medium text-foreground-strong">
            {title}
          </span>
        </span>
        <ChevronDown
          size={20}
          className={`text-foreground-subtle transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && <div className="mt-3 flex flex-col gap-0.5">{children}</div>}
    </div>
  );
}

function FilterCheckboxRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-1.5 py-2 transition-colors hover:bg-background-muted/60">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <label
        htmlFor={id}
        className="flex-1 cursor-pointer text-sm text-foreground-muted"
      >
        {label}
      </label>
    </div>
  );
}
