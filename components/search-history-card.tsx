"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@appica/ui-react/button";
import { Trash } from "@appica/icons-react";
import {
  clearSearchHistory,
  getSearchHistory,
  getServerSearchHistory,
  subscribeSearchHistory,
} from "@/lib/search-history";
import { plural } from "@/lib/i18n/translate";
import { useTranslations } from "./i18n-provider";

export function SearchHistoryCard() {
  const t = useTranslations();
  const history = useSyncExternalStore(
    subscribeSearchHistory,
    getSearchHistory,
    getServerSearchHistory,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-muted">
        {history.length === 0
          ? t("account.searchHistoryEmpty")
          : plural(t, "account.searchHistoryCount", history.length)}
      </p>

      {history.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {history.map((term) => (
            <li
              key={term}
              className="rounded-full bg-background-muted px-3 py-1 text-sm text-foreground-muted"
            >
              {term}
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="outline"
        className="rounded-full"
        disabled={history.length === 0}
        onClick={() => clearSearchHistory()}
      >
        <Trash size={18} />
        {t("account.clearSearchHistory")}
      </Button>
    </div>
  );
}
