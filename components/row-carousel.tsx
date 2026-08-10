"use client";

import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrev,
} from "@appica/ui-react/carousel";
import { ChevronLeft, ChevronRight } from "@appica/icons-react";
import { useTranslations } from "./i18n-provider";

interface RowCarouselProps {
  title: string;
  moreHref?: string;
  moreLabel?: string;
  children: React.ReactNode;
}

function navButton() {
  return <Button variant="soft" size="icon-sm" className="rounded-full" />;
}

export function RowCarousel({
  title,
  moreHref,
  moreLabel,
  children,
}: RowCarouselProps) {
  const t = useTranslations();

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
          {moreHref && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              render={<Link href={moreHref} />}
            >
              {moreLabel ?? t("home.seeAll")} <ChevronRight size={16} />
            </Button>
          )}
        </div>
        <CarouselContent>{children}</CarouselContent>
        <div className="mt-3 flex items-center justify-end gap-1.5">
          <CarouselPrev
            position="none"
            aria-label={t("home.scrollLeft")}
            render={navButton()}
          >
            <ChevronLeft size={18} />
          </CarouselPrev>
          <CarouselNext
            position="none"
            aria-label={t("home.scrollRight")}
            render={navButton()}
          >
            <ChevronRight size={18} />
          </CarouselNext>
        </div>
      </Carousel>
    </section>
  );
}
