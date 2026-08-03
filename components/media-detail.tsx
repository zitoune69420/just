import Image from "next/image";
import { Badge } from "@appica/ui-react/badge";
import { CarouselSlide } from "@appica/ui-react/carousel";
import { Thumbnail } from "@appica/ui-react/thumbnail";
import { StarFilled } from "@appica/icons-react";
import { tmdbImage } from "@/lib/media";
import { resolveStreamSource } from "@/lib/streaming";
import type { MediaDetails } from "@/lib/types";
import { MediaRow } from "./media-row";
import { RowCarousel } from "./row-carousel";
import { TrailerPlayer } from "./trailer-player";
import { WatchButton } from "./watch-button";
import { WatchSection } from "./watch-section";

const TYPE_LABELS: Record<MediaDetails["type"], string> = {
  movie: "Film",
  tv: "Série",
};

const BACKDROP_FADE =
  "[-webkit-mask-image:linear-gradient(to_bottom,black_72%,#000b_85%,#0004_95%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_72%,#000b_85%,#0004_95%,transparent_100%)]";

const BACKDROP_BLUR_LAYERS = [
  "blur-lg scale-110 [-webkit-mask-image:linear-gradient(to_bottom,transparent_66%,black_80%)] [mask-image:linear-gradient(to_bottom,transparent_66%,black_80%)]",
  "blur-xl scale-125 [-webkit-mask-image:linear-gradient(to_bottom,transparent_78%,black_88%)] [mask-image:linear-gradient(to_bottom,transparent_78%,black_88%)]",
  "blur-2xl scale-125 [-webkit-mask-image:linear-gradient(to_bottom,transparent_86%,black_96%)] [mask-image:linear-gradient(to_bottom,transparent_86%,black_96%)]",
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function MediaDetailView({ details }: { details: MediaDetails }) {
  const backdropUrl = details.backdrop
    ? tmdbImage(details.backdrop, "w1280")
    : null;

  const streamSource = await resolveStreamSource({
    type: details.type,
    tmdbId: details.id,
    originalTitle: details.originalTitle,
    year: details.year,
  });

  return (
      <article className="enter pb-16">
        <div
            className={`relative h-[45vh] min-h-80 w-full overflow-hidden ${BACKDROP_FADE}`}
        >
          {backdropUrl && (
              <>
                <Image
                    src={backdropUrl}
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                {BACKDROP_BLUR_LAYERS.map((layer) => (
                    <Image
                        key={layer}
                        src={backdropUrl}
                        alt=""
                        fill
                        sizes="100vw"
                        className={`object-cover ${layer}`}
                    />
                ))}
              </>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent to-35%"/>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="relative z-10 -mt-36 flex flex-col gap-6 sm:-mt-44 sm:flex-row sm:items-end sm:gap-8">
            <div
                className="relative aspect-2/3 w-40 shrink-0 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-border/60 sm:w-56">
              {details.poster ? (
                  <Image
                      src={tmdbImage(details.poster, "w500")}
                      alt={`Affiche : ${details.title}`}
                      fill
                      sizes="(min-width: 640px) 224px, 160px"
                      className="object-cover"
                  />
              ) : (
                  <div className="size-full bg-background-muted"/>
              )}
            </div>

            <div className="max-w-2xl space-y-4 pb-1">
              <Badge variant="soft" size="sm" className="rounded-full">
                {TYPE_LABELS[details.type]}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl sm:tracking-[-0.03em]">
                {details.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
                {details.votes > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground-strong">
                  <StarFilled size={18} className="text-warning"/>
                      {details.rating.toFixed(1)}
                </span>
                )}
                {details.facts.length > 0 && (
                    <span>{details.facts.join(" · ")}</span>
                )}
              </div>
              {details.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {details.genres.map((genre) => (
                        <Badge
                            key={genre.id}
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                        >
                          {genre.name}
                        </Badge>
                    ))}
                  </div>
              )}
              <div className="pt-1">
                <WatchButton id={details.id} />
              </div>
            </div>
          </header>

          <div className="mt-10 grid gap-12 lg:mt-14">
            <WatchSection details={details}/>

            <section className="max-w-3xl space-y-3">
              {details.tagline && (
                  <p className="text-base text-foreground-muted italic">
                    « {details.tagline} »
                  </p>
              )}
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                Synopsis
              </h2>
              <p className="text-[15px]/7 text-foreground-muted">
                {details.overview || "Aucun synopsis disponible."}
              </p>
            </section>

            {details.trailerKey && (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                    Bande-annonce
                  </h2>
                  <div className="max-w-4xl">
                    <TrailerPlayer
                        videoKey={details.trailerKey}
                        title={details.title}
                        backdrop={details.backdrop}
                    />
                  </div>
                </section>
            )}

            {details.cast.length > 0 && (
                <RowCarousel title="Distribution">
                  {details.cast.map((member, index) => (
                      <CarouselSlide
                          key={`${member.id}-${index}`}
                          className="basis-28 sm:basis-32"
                      >
                        <figure className="flex flex-col items-center gap-2.5 text-center">
                          <Thumbnail
                              shape="circle"
                              size={110}
                              src={
                                member.profile
                                    ? tmdbImage(member.profile, "w185")
                                    : undefined
                              }
                              alt={member.name}
                          >
                            {initials(member.name)}
                          </Thumbnail>
                          <figcaption>
                            <p className="line-clamp-1 text-sm font-medium text-foreground-strong">
                              {member.name}
                            </p>
                            <p className="line-clamp-1 text-xs text-foreground-muted">
                              {member.character}
                            </p>
                          </figcaption>
                        </figure>
                      </CarouselSlide>
                  ))}
                </RowCarousel>
            )}

            {details.recommendations.length > 0 && (
                <MediaRow title="Recommandations" items={details.recommendations}/>
            )}
          </div>
        </div>
      </article>
  );
}
