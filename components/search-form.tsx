"use client";

import { useRouter } from "next/navigation";
import { Input } from "@appica/ui-react/input";
import { Search } from "@appica/icons-react";

export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q");
    if (typeof query === "string" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="max-w-xl">
      <Input
        key={initialQuery}
        name="q"
        inputSize="lg"
        defaultValue={initialQuery}
        placeholder="Titre d’un film ou d’une série…"
        aria-label="Rechercher un film ou une série"
        startSlot={<Search size={18} />}
        autoFocus={initialQuery === ""}
        className="rounded-full"
      />
    </form>
  );
}
