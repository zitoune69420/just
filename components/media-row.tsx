import { CarouselSlide } from "@appica/ui-react/carousel";
import type { Media } from "@/lib/types";
import { MediaCard } from "./media-card";
import { RowCarousel } from "./row-carousel";

interface MediaRowProps {
  title: string;
  items: Media[];
  moreHref?: string;
}

export function MediaRow({ title, items, moreHref }: MediaRowProps) {
  if (items.length === 0) return null;

  return (
    <RowCarousel title={title} moreHref={moreHref}>
      {items.map((media) => (
        <CarouselSlide
          key={`${media.type}-${media.id}`}
          className="basis-40 sm:basis-48"
        >
          <MediaCard
            media={media}
            sizes="(min-width: 640px) 176px, 144px"
          />
        </CarouselSlide>
      ))}
    </RowCarousel>
  );
}
