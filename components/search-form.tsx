"use client";

import { useRouter } from "next/navigation";
import { Button } from "@appica/ui-react/button";
import { Input } from "@appica/ui-react/input";
import { Search } from "@appica/icons-react";
import { rememberSearch } from "@/lib/search-history";

export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q");
    if (typeof query === "string" && query.trim()) {
      rememberSearch(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex max-w-xl gap-4"
    >
      <Input
        key={initialQuery}
        name="q"
        inputSize="lg"
        defaultValue={initialQuery}
        placeholder="Titre d’un film ou d’une série…"
        aria-label="Rechercher un film ou une série"
        startSlot={<Search size={18} />}
        autoFocus={initialQuery === ""}
        className="flex-1 rounded-full"
      />
      <Button
        type="submit"
        size="lg"
        className="press shrink-0 rounded-full bg-white text-black before:border before:border-border before:bg-white hover:before:bg-white/85 max-sm:px-4"
      >
        <Search size={18} className="sm:hidden" />
        <span className="max-sm:hidden">Rechercher</span>
      </Button>
    </form>
  );
}
