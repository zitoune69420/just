"use client";

import { Button } from "@appica/ui-react/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@appica/ui-react/tooltip";
import { Bookmark, BookmarkFilled } from "@appica/icons-react";
import { useCollections } from "./collections-provider";
import { useTranslations } from "./i18n-provider";
import type { MediaType } from "@/lib/types";

interface WatchlistButtonProps {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  variant?: "overlay" | "inline";
  className?: string;
}

/**
 * Pendant sobre de `FavoriteButton` : « à voir plus tard » est un geste de
 * rangement, pas d'enthousiasme. Pas d'éclat de particules, juste le marque-page
 * qui se remplit.
 */
function BookmarkSwap({ saved, size }: { saved: boolean; size: number }) {
  return (
    <span
      className={`grid transition-[scale] duration-300 ease-back group-active:scale-[0.82] motion-reduce:scale-100 ${
        saved ? "scale-100" : "scale-95"
      }`}
    >
      <Bookmark
        size={size}
        className={`col-start-1 row-start-1 transition-opacity duration-100 ease-out ${
          saved ? "opacity-0" : "opacity-100"
        }`}
      />
      <BookmarkFilled
        size={size}
        className={`col-start-1 row-start-1 text-accent transition-opacity duration-100 ease-out ${
          saved ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
  );
}

export function WatchlistButton({
  mediaType,
  tmdbId,
  title,
  variant = "overlay",
  className = "",
}: WatchlistButtonProps) {
  const t = useTranslations();
  const { has, isBusy, toggle } = useCollections();
  const saved = has("watchlist", mediaType, tmdbId);
  const busy = isBusy("watchlist", mediaType, tmdbId);

  const label = t(
    saved ? "detail.watchlistRemoveLabel" : "detail.watchlistAddLabel",
    { title },
  );

  if (variant === "inline") {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-lg"
              className={`group relative overflow-visible rounded-full ${className}`}
              aria-pressed={saved}
              aria-busy={busy}
              aria-label={label}
              onClick={() => toggle("watchlist", mediaType, tmdbId)}
            >
              <BookmarkSwap saved={saved} size={20} />
            </Button>
          }
        />
        <TooltipContent>
          {t(saved ? "detail.watchlistRemove" : "detail.watchlistAdd")}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-busy={busy}
      aria-label={label}
      onClick={() => toggle("watchlist", mediaType, tmdbId)}
      className={`group grid size-8 place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/15 backdrop-blur-sm transition-colors outline-none before:absolute before:-inset-2 before:content-[''] focus-visible:ring-2 focus-visible:ring-white [@media(hover:hover)]:hover:bg-black/75 ${className}`}
    >
      <BookmarkSwap saved={saved} size={17} />
    </button>
  );
}
