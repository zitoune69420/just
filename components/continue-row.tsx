import { CarouselSlide } from "@appica/ui-react/carousel";
import type { Media } from "@/lib/types";
import { ForgetProgressButton } from "./forget-progress-button";
import { MediaCard } from "./media-card";
import { RowCarousel } from "./row-carousel";

/**
 * Comme MediaRow, mais chaque affiche porte un bouton « marquer comme vu »
 * qui supprime la reprise de lecture.
 */
export function ContinueRow({ title, items }: { title: string; items: Media[] }) {
  if (items.length === 0) return null;

  return (
    <RowCarousel title={title}>
      {items.map((media) => (
        <CarouselSlide
          key={`${media.type}-${media.id}`}
          className="basis-40 sm:basis-48"
        >
          <div className="relative">
            <MediaCard media={media} sizes="(min-width: 640px) 176px, 144px" />
            <ForgetProgressButton
              mediaType={media.type}
              tmdbId={media.id}
              title={media.title}
              className="absolute start-2 top-2 z-10"
            />
          </div>
        </CarouselSlide>
      ))}
    </RowCarousel>
  );
}
