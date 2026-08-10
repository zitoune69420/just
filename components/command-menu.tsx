"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  Autocomplete,
  AutocompleteCollection,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteLabel,
  AutocompleteList,
} from "@appica/ui-react/autocomplete";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import { Kbd } from "@appica/ui-react/kbd";
import { Separator } from "@appica/ui-react/separator";
import { Spinner } from "@appica/ui-react/spinner";
import { History, MovieOff, Search, UserOff, X } from "@appica/icons-react";
import { tmdbImage } from "@/lib/media";
import {
  forgetSearch,
  getSearchHistory,
  getServerSearchHistory,
  rememberSearch,
  subscribeSearchHistory,
} from "@/lib/search-history";
import type { Translate } from "@/lib/i18n/translate";
import type { MediaType, Person } from "@/lib/types";
import { useTranslations } from "./i18n-provider";

interface SearchHit {
  id: number;
  type: MediaType;
  title: string;
  year: string | null;
  poster: string | null;
}

type Entry =
  | { kind: "history"; key: string; term: string }
  | { kind: "media"; key: string; hit: SearchHit }
  | { kind: "person"; key: string; person: Person };

interface EntryGroup {
  value: string;
  items: Entry[];
}

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

function toGroups(groups: EntryGroup[]): EntryGroup[] {
  return groups.filter((group) => group.items.length > 0);
}

export function CommandMenu() {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [suggestions, setSuggestions] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const history = useSyncExternalStore(
    subscribeSearchHistory,
    getSearchHistory,
    getServerSearchHistory,
  );

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
        const data = (await response.json()) as {
          results?: SearchHit[];
          people?: Person[];
        };
        if (!cancelled) {
          setHits(data.results ?? []);
          setPeople(data.people ?? []);
        }
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

  const groups: EntryGroup[] = canSearch
    ? toGroups([
        {
          value: t("command.people"),
          items: people.map((person) => ({
            kind: "person" as const,
            key: `person-${person.id}`,
            person,
          })),
        },
        {
          value: t("command.titles"),
          items: hits.map((hit) => ({
            kind: "media" as const,
            key: `${hit.type}-${hit.id}`,
            hit,
          })),
        },
      ])
    : toGroups([
        {
          value: t("command.recent"),
          items: history.map((entry) => ({
            kind: "history" as const,
            key: `history-${entry}`,
            term: entry,
          })),
        },
        {
          value: t("command.suggestions"),
          items: suggestions.map((hit) => ({
            kind: "media" as const,
            key: `${hit.type}-${hit.id}`,
            hit,
          })),
        },
      ]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setHits([]);
      setPeople([]);
    }
  }

  function select(entry: Entry) {
    if (entry.kind === "history") {
      setQuery(entry.term);
      return;
    }

    rememberSearch(term);
    handleOpenChange(false);
    router.push(
      entry.kind === "person"
        ? `/person/${entry.person.id}`
        : `/${entry.hit.type}/${entry.hit.id}`,
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="press flex h-9 w-52 items-center gap-2 rounded-full border border-border bg-background-subtle/60 px-3.5 text-sm text-foreground-subtle outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring max-lg:hidden"
      >
        <Search size={16} className="shrink-0" />
        <span className="flex-1 text-start">{t("command.trigger")}</span>
        <Kbd>⌘K</Kbd>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          closeButton={false}
          className="w-full max-w-2xl overflow-hidden border-border-overlay bg-background p-0 pb-1 shadow-2xl"
          aria-label={t("command.dialogLabel")}
        >
          <Autocomplete inline open mode="none" items={groups}>
            <div data-slot="dialog-header" className="px-2 pt-2">
              <AutocompleteInput
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("command.placeholder")}
                endSlot={loading ? <Spinner className="text-base" /> : null}
                className="border-0! bg-transparent! shadow-none has-focus:border-transparent! has-focus:bg-transparent! has-focus:ring-0!"
              />
            </div>

            <Separator className="my-2" />

            <div data-slot="dialog-footer" className="pb-2">
              <AutocompleteList className="slim-scrollbar max-h-80">
                {(group: EntryGroup) => (
                  <AutocompleteGroup key={group.value} items={group.items}>
                    <AutocompleteLabel className="px-2 pt-1 pb-1.5 text-xs font-medium text-foreground-subtle">
                      {group.value}
                    </AutocompleteLabel>
                    <AutocompleteCollection>
                      {(entry: Entry) => (
                        <AutocompleteItem
                          key={entry.key}
                          value={entry}
                          onClick={() => select(entry)}
                          className="flex items-center gap-3 rounded-2xl p-2"
                        >
                          <EntryRow entry={entry} onForget={forgetSearch} t={t} />
                        </AutocompleteItem>
                      )}
                    </AutocompleteCollection>
                  </AutocompleteGroup>
                )}
              </AutocompleteList>

              <AutocompleteEmpty className="px-3 py-8 text-center text-sm text-foreground-muted">
                {!canSearch
                  ? t("command.hint")
                  : loading
                    ? t("command.searching")
                    : t("command.noResults", { term })}
              </AutocompleteEmpty>
            </div>
          </Autocomplete>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Poster({
  path,
  alt,
  fallback,
}: {
  path: string | null;
  alt: string;
  fallback: React.ReactNode;
}) {
  return (
    <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-sm bg-background-muted">
      {path ? (
        <Image
          src={tmdbImage(path, "w185")}
          alt={alt}
          fill
          sizes="44px"
          className="object-cover"
        />
      ) : (
        <span className="grid size-full place-items-center text-foreground-subtle">
          {fallback}
        </span>
      )}
    </span>
  );
}

function EntryRow({
  entry,
  onForget,
  t,
}: {
  entry: Entry;
  onForget: (term: string) => void;
  t: Translate;
}) {
  if (entry.kind === "history") {
    return (
      <>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-background-muted text-foreground-subtle">
          <History size={18} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm text-foreground-strong">
          {entry.term}
        </span>
        <button
          type="button"
          aria-label={t("command.forget", { term: entry.term })}
          onClick={(event) => {
            event.stopPropagation();
            onForget(entry.term);
          }}
          className="press grid size-7 shrink-0 place-items-center rounded-full text-foreground-subtle outline-none transition-colors hover:bg-background-muted hover:text-foreground-strong focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X size={15} />
        </button>
      </>
    );
  }

  if (entry.kind === "person") {
    return (
      <>
        <Poster
          path={entry.person.profile}
          alt=""
          fallback={<UserOff size={18} />}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground-strong">
            {entry.person.name}
          </span>
          <span className="block text-xs text-foreground-muted">
            {entry.person.department ?? t("media.person")}
          </span>
        </span>
      </>
    );
  }

  return (
    <>
      <Poster path={entry.hit.poster} alt="" fallback={<MovieOff size={18} />} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground-strong">
          {entry.hit.title}
        </span>
        <span className="block text-xs text-foreground-muted">
          {t(`media.${entry.hit.type}`)}
          {entry.hit.year ? ` · ${entry.hit.year}` : ""}
        </span>
      </span>
    </>
  );
}
