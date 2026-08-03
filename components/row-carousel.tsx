"use client";

import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrev,
} from "@appica/ui-react/carousel";
import { ChevronRight } from "@appica/icons-react";

interface RowCarouselProps {
  title: string;
  moreHref?: string;
  children: React.ReactNode;
}

export function RowCarousel({ title, moreHref, children }: RowCarouselProps) {
  return (
    <section className="enter min-w-0">
      <Carousel
        dragFree
        align="start"
        containScroll="trimSnaps"
        className="[&_[data-slot=carousel-viewport]]:rounded-t-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h2>
          <div className="flex items-center gap-1.5">
            {moreHref && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                render={<Link href={moreHref} />}
              >
                Voir tout <ChevronRight size={16} />
              </Button>
            )}
            <CarouselPrev position="none" className="max-sm:hidden" />
            <CarouselNext position="none" className="max-sm:hidden" />
          </div>
        </div>
        <CarouselContent>{children}</CarouselContent>
      </Carousel>
    </section>
  );
}
