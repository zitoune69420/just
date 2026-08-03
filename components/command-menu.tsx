"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@appica/ui-react/autocomplete";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import { Kbd } from "@appica/ui-react/kbd";
import { Separator } from "@appica/ui-react/separator";
import { Spinner } from "@appica/ui-react/spinner";
import { MovieOff, Search } from "@appica/icons-react";
import { tmdbImage } from "@/lib/media";
import type { MediaType } from "@/lib/types";

interface SearchHit {
  id: number;
  type: MediaType;
  title: string;
  year: string | null;
  poster: string | null;
}

const TYPE_LABELS: Record<MediaType, string> = {
  movie: "Film",
  tv: "Série",
};

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const term = query.trim();
  const canSearch = term.length >= MIN_QUERY;

  useEffect(() => {
    if (!canSearch) return;

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as { results?: SearchHit[] };
        if (!cancelled) setHits(data.results ?? []);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, canSearch]);

  useEffect(() => {
    if (!open || suggestions.length > 0) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/search?q=");
        const data = (await response.json()) as { results?: SearchHit[] };
        if (!cancelled) setSuggestions(data.results ?? []);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [open, suggestions.length]);

  const visibleHits = canSearch ? hits : suggestions;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setHits([]);
    }
  }

  function goTo(hit: SearchHit) {
    handleOpenChange(false);
    router.push(`/${hit.type}/${hit.id}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press flex h-9 w-52 items-center gap-2 rounded-full border border-border bg-background-subtle/60 px-3.5 text-sm text-foreground-subtle outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring max-lg:hidden"
      >
        <Search size={16} className="shrink-0" />
        <span className="flex-1 text-start">Rechercher…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          closeButton={false}
          className="w-full max-w-2xl overflow-hidden border-border-overlay bg-background p-0 pb-1 shadow-2xl"
          aria-label="Rechercher un film ou une série"
        >
          <Autocomplete inline open mode="none" items={visibleHits}>
            <div data-slot="dialog-header" className="px-2 pt-2">
              <AutocompleteInput
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un film ou une série…"
                endSlot={
                  loading ? (
                    <Spinner className="text-base" />
                  ) : null
                }
                className="border-0! bg-transparent! shadow-none has-focus:border-transparent! has-focus:bg-transparent! has-focus:ring-0!"
              />
            </div>

            <Separator className="my-2" />

            <div data-slot="dialog-footer" className="pb-2">
              {!canSearch && suggestions.length > 0 && (
                <p className="px-2 pb-2 text-xs font-medium text-foreground-subtle">
                  Suggestions
                </p>
              )}
              <AutocompleteList className="slim-scrollbar max-h-80">
                {(hit: SearchHit) => (
                  <AutocompleteItem
                    key={`${hit.type}-${hit.id}`}
                    value={hit}
                    onClick={() => goTo(hit)}
                    className="flex items-center gap-3 rounded-2xl p-2"
                  >
                    <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-sm bg-background-muted">
                      {hit.poster ? (
                        <Image
                          src={tmdbImage(hit.poster, "w185")}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-foreground-subtle">
                          <MovieOff size={18} />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground-strong">
                        {hit.title}
                      </span>
                      <span className="block text-xs text-foreground-muted">
                        {TYPE_LABELS[hit.type]}
                        {hit.year ? ` · ${hit.year}` : ""}
                      </span>
                    </span>
                  </AutocompleteItem>
                )}
              </AutocompleteList>

              <AutocompleteEmpty className="px-3 py-8 text-center text-sm text-foreground-muted">
                {!canSearch
                  ? "Tapez le titre d’un film ou d’une série."
                  : loading
                    ? "Recherche…"
                    : `Aucun résultat pour « ${term} »`}
              </AutocompleteEmpty>
            </div>
          </Autocomplete>
        </DialogContent>
      </Dialog>
    </>
  );
}
