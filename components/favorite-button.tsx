"use client";

import { useState } from "react";
import { Button } from "@appica/ui-react/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@appica/ui-react/tooltip";
import { Heart, HeartFilled } from "@appica/icons-react";
import { useCollections } from "./collections-provider";
import { useTranslations } from "./i18n-provider";
import type { MediaType } from "@/lib/types";

interface FavoriteButtonProps {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  variant?: "overlay" | "inline";
  className?: string;
}

const PARTICLES = [
  { angle: 8, distance: 22, warm: false },
  { angle: 52, distance: 18, warm: true },
  { angle: 96, distance: 24, warm: false },
  { angle: 141, distance: 19, warm: true },
  { angle: 187, distance: 23, warm: false },
  { angle: 231, distance: 17, warm: true },
  { angle: 275, distance: 24, warm: false },
  { angle: 318, distance: 20, warm: true },
];



function Burst({ id, size }: { id: number; size: number }) {
  return (
    <span
      key={id}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      <span
        className="favorite-flash absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-error"
        style={{ width: size * 1.6, height: size * 1.6 }}
      />
      {PARTICLES.map((particle, index) => (
        <span
          key={particle.angle}
          className={`favorite-particle absolute top-1/2 left-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full ${
            particle.warm ? "bg-warning" : "bg-error"
          }`}
          style={
            {
              "--angle": `${particle.angle}deg`,
              "--distance": `${particle.distance}px`,
              animationDelay: `${index * 9}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

function HeartSwap({
  favorite,
  burst,
  size,
}: {
  favorite: boolean;
  burst: number;
  size: number;
}) {
  return (
    <span className="relative grid place-items-center">
      {burst > 0 && <Burst id={burst} size={size} />}
      <span
        className={`col-start-1 row-start-1 grid transition-[scale] duration-300 ease-back group-active:scale-[0.82] motion-reduce:scale-100 ${
          favorite ? "scale-100" : "scale-95"
        }`}
      >
        <Heart
          size={size}
          className={`col-start-1 row-start-1 transition-opacity duration-100 ease-out ${
            favorite ? "opacity-0" : "opacity-100"
          }`}
        />
        <HeartFilled
          size={size}
          className={`col-start-1 row-start-1 text-error transition-opacity duration-100 ease-out ${
            favorite ? "opacity-100" : "opacity-0"
          }`}
        />
      </span>
    </span>
  );
}

export function FavoriteButton({
  mediaType,
  tmdbId,
  title,
  variant = "overlay",
  className = "",
}: FavoriteButtonProps) {
  const t = useTranslations();
  const { has, isBusy, toggle } = useCollections();
  const [burst, setBurst] = useState(0);
  const favorite = has("favorite", mediaType, tmdbId);
  const busy = isBusy("favorite", mediaType, tmdbId);

  function handleClick() {
    if (!favorite) setBurst((count) => count + 1);
    toggle("favorite", mediaType, tmdbId);
  }

  if (variant === "inline") {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-lg"
              className={`group relative overflow-visible rounded-full ${className}`}
              aria-pressed={favorite}
              aria-busy={busy}
              aria-label={t(
                favorite
                  ? "detail.favoriteRemoveLabel"
                  : "detail.favoriteAddLabel",
                { title },
              )}
              onClick={handleClick}
            >
              <HeartSwap favorite={favorite} burst={burst} size={20} />
            </Button>
          }
        />
        <TooltipContent>
          {t(favorite ? "detail.favoriteRemove" : "detail.favoriteAdd")}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-busy={busy}
      aria-label={t(favorite ? "detail.favoriteRemoveLabel" : "detail.favoriteAddLabel", { title })}
      onClick={handleClick}
      className={`group grid size-8 place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/15 backdrop-blur-sm transition-colors outline-none before:absolute before:-inset-2 before:content-[''] focus-visible:ring-2 focus-visible:ring-white [@media(hover:hover)]:hover:bg-black/75 ${className}`}
    >
      <HeartSwap favorite={favorite} burst={burst} size={17} />
    </button>
  );
}
