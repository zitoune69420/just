"use client";

import { useRouter } from "next/navigation";
import { Button } from "@appica/ui-react/button";
import { Input } from "@appica/ui-react/input";
import { Search } from "@appica/icons-react";
import { rememberSearch } from "@/lib/search-history";
import { useTranslations } from "./i18n-provider";

export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const t = useTranslations();
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
      className="flex w-full max-w-xl gap-2 sm:gap-4"
    >
      {/*
        `min-w-0` est ce qui empêche le champ de pousser le bouton hors de
        l'écran : un `input` porte une largeur intrinsèque que `flex-1` ne
        contredit pas, et sous 380px la marge n'existe plus.
      */}
      <Input
        key={initialQuery}
        name="q"
        inputSize="lg"
        defaultValue={initialQuery}
        placeholder={t("search.placeholder")}
        aria-label={t("search.label")}
        startSlot={<Search size={18} />}
        autoFocus={initialQuery === ""}
        className="min-w-0 flex-1 rounded-full"
      />
      <Button
        type="submit"
        size="lg"
        className="press shrink-0 rounded-full bg-white text-black before:border before:border-border before:bg-white hover:before:bg-white/85 max-sm:px-4"
      >
        <Search size={18} className="sm:hidden" />
        <span className="max-sm:hidden">{t("search.submit")}</span>
      </Button>
    </form>
  );
}
