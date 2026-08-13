"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import {
  Carousel,
  CarouselContent,
  CarouselPagination,
  CarouselSlide,
} from "@appica/ui-react/carousel";
import { InfoCircle, PlayerPlayFilled, StarFilled } from "@appica/icons-react";
import { tmdbImage } from "@/lib/media";
import { useTranslations } from "./i18n-provider";
import type { Media } from "@/lib/types";

export function HeroCarousel({ items }: { items: Media[] }) {
  const t = useTranslations();

  if (items.length === 0) return null;

  return (
    <Carousel
      loop
      fade
      light
      autoplay={{ delay: 6000 }}
      className="enter overflow-hidden rounded-3xl sm:rounded-4xl"
    >
      <CarouselContent>
        {items.map((media, index) => {
          const href = `/${media.type}/${media.id}`;
          return (
            <CarouselSlide key={`${media.type}-${media.id}`}>
              <article className="relative aspect-4/5 max-h-[560px] w-full overflow-hidden sm:aspect-video lg:aspect-21/9">
                {media.backdrop && (
                  <Image
                    src={tmdbImage(media.backdrop, "w1280")}
                    alt=""
                    fill
                    priority={index === 0}
                    sizes="(min-width: 1280px) 1216px, 100vw"
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 sm:max-w-xl sm:space-y-4 sm:p-10">
                  <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                    {t(`media.${media.type}`)}
                  </span>
                  <h2 className="text-2xl font-bold tracking-tight text-balance text-white sm:text-4xl lg:text-5xl lg:tracking-[-0.03em]">
                    {media.title}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-white/85">
                    {media.votes > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <StarFilled size={18} className="text-warning" />
                        {media.rating.toFixed(1)}
                      </span>
                    )}
                    {media.year && <span>{media.year}</span>}
                  </div>
                  <p className="line-clamp-2 max-w-prose text-sm text-white/75 sm:text-base">
                    {media.overview}
                  </p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Button
                      size="lg"
                      className="rounded-full"
                      render={<Link href={href} />}
                    >
                      <PlayerPlayFilled size={18} /> {t("detail.watch")}
                    </Button>
                    {/*
                      Sur mobile les deux boutons mènent à la même page : le
                      second n'ajoutait qu'un doublon, dans la largeur où la
                      place manque le plus.
                    */}
                    <Button
                      variant="light"
                      size="lg"
                      className="rounded-full max-sm:hidden"
                      render={<Link href={href} />}
                    >
                      <InfoCircle size={18} /> {t("hero.moreInfo")}
                    </Button>
                  </div>
                </div>
              </article>
            </CarouselSlide>
          );
        })}
      </CarouselContent>
      <CarouselPagination className="absolute end-6 bottom-5 max-sm:hidden" />
    </Carousel>
  );
}
