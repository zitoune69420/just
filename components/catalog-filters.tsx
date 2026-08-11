"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@appica/ui-react/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@appica/ui-react/collapsible";
import { Separator } from "@appica/ui-react/separator";
import { ArrowsSort, ChevronDown, Tags } from "@appica/icons-react";
import type { SortKey } from "@/lib/tmdb";
import type { TmdbGenre } from "@/lib/types";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popularity", label: "Popularité" },
  { value: "rating", label: "Mieux notés" },
  { value: "year", label: "Plus récents" },
  { value: "title", label: "A-Z" },
];

interface CatalogFiltersProps {
  basePath: string;
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
  const [sortOpen, setSortOpen] = useState(true);
  const [genresOpen, setGenresOpen] = useState(true);

  const hasActiveFilters = selectedGenreIds.length > 0 || sort !== "popularity";

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ top: false, bottom: false });

  useEffect(() => {
    const box = scrollRef.current;
    const content = contentRef.current;
    if (!box || !content) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = box;
      const top = scrollTop > 8;
      const bottom = scrollTop + clientHeight < scrollHeight - 8;
      setFade((current) =>
        current.top === top && current.bottom === bottom
          ? current
          : { top, bottom },
      );
    };

    update();
    box.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(content);
    observer.observe(box);

    return () => {
      box.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function toggleGenre(genreId: number) {
    const next = selectedGenreIds.includes(genreId)
      ? selectedGenreIds.filter((id) => id !== genreId)
      : [...selectedGenreIds, genreId];
    router.push(buildHref(basePath, next, sort));
  }

  return (
    <aside className="flex max-h-[60vh] w-full flex-col rounded-3xl border border-border/60 bg-background-subtle/60 p-5 backdrop-blur-sm lg:sticky lg:top-20 lg:h-[80vh] lg:max-h-[calc(100vh-6rem)] lg:w-72 lg:shrink-0">
      <div
        ref={scrollRef}
        data-fade-top={fade.top}
        data-fade-bottom={fade.bottom}
        className="no-scrollbar scroll-hint min-h-0 flex-1 overflow-y-auto"
      >
        <div ref={contentRef}>
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
                  router.push(
                    buildHref(basePath, selectedGenreIds, option.value),
                  );
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
        </div>
      </div>
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
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex w-full items-center justify-between border-b border-border/60 pb-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-2">
          <Icon size={20} className="text-foreground-muted" />
          <span className="text-sm font-medium text-foreground-strong">
            {title}
          </span>
        </span>
        <ChevronDown
          size={20}
          className={`text-foreground-subtle transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-3 flex flex-col gap-0.5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
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
