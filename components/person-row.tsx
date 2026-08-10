import { CarouselSlide } from "@appica/ui-react/carousel";
import type { Person } from "@/lib/types";
import { PersonCard } from "./person-card";
import { RowCarousel } from "./row-carousel";

export function PersonRow({
  title,
  people,
  moreHref,
  moreLabel,
}: {
  title: string;
  people: Person[];
  moreHref?: string;
  moreLabel?: string;
}) {
  if (people.length === 0) return null;

  return (
    <RowCarousel title={title} moreHref={moreHref} moreLabel={moreLabel}>
      {people.map((person) => (
        <CarouselSlide key={person.id} className="basis-40 sm:basis-48">
          <PersonCard
            person={person}
            sizes="(min-width: 640px) 176px, 144px"
          />
        </CarouselSlide>
      ))}
    </RowCarousel>
  );
}
