import Link from "next/link";
import { CarouselSlide } from "@appica/ui-react/carousel";
import type { Media } from "@/lib/types";
import { FavoriteButton } from "./favorite-button";
import { MediaPoster } from "./media-card";
import { RowCarousel } from "./row-carousel";

interface TopMediaRowProps {
  title: string;
  items: Media[];
  moreHref?: string;
}

const RANK_CLASSES =
  "pointer-events-none shrink-0 select-none font-black leading-[0.72] tracking-[-0.06em] text-transparent text-[10rem] sm:text-[14rem] [-webkit-text-stroke:2px_var(--foreground-subtle)] sm:[-webkit-text-stroke:3px_var(--foreground-subtle)]";

function TopMediaCard({ media, rank }: { media: Media; rank: number }) {
  return (
    <div className="relative flex items-end">
      <span aria-hidden className={RANK_CLASSES}>
        {rank}
      </span>

      <Link
        href={`/${media.type}/${media.id}`}
        aria-label={`N°${rank} : ${media.title}`}
        className="press group relative z-10 -ms-6 block w-32 shrink-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:-ms-8 sm:w-44"
      >
        <MediaPoster media={media} sizes="(min-width: 640px) 220px, 160px" />
      </Link>

      <FavoriteButton
        mediaType={media.type}
        tmdbId={media.id}
        title={media.title}
        className="absolute end-2 top-2 z-20"
      />
    </div>
  );
}

export function TopMediaRow({ title, items, moreHref }: TopMediaRowProps) {
  if (items.length === 0) return null;

  return (
    <RowCarousel title={title} moreHref={moreHref}>
      {items.map((media, index) => (
        <CarouselSlide key={`${media.type}-${media.id}`} className="basis-auto">
          <TopMediaCard media={media} rank={index + 1} />
        </CarouselSlide>
      ))}
    </RowCarousel>
  );
}
