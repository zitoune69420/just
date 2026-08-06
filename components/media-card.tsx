import Image from "next/image";
import Link from "next/link";
import { MovieOff, StarFilled } from "@appica/icons-react";
import { tmdbImage } from "@/lib/media";
import type { Media } from "@/lib/types";
import { FavoriteButton } from "./favorite-button";

interface MediaCardProps {
  media: Media;
  sizes?: string;
}

export function MediaCard({ media, sizes = "190px" }: MediaCardProps) {
  return (
    <div className="relative">
      <Link
        href={`/${media.type}/${media.id}`}
        className="press group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-2/3 overflow-hidden rounded-2xl bg-background-muted ring-1 ring-border/50">
          {media.poster ? (
            <Image
              src={tmdbImage(media.poster, "w342")}
              alt={media.title}
              fill
              sizes={sizes}
              className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div className="grid size-full place-items-center text-foreground-subtle">
              <MovieOff size={40} />
            </div>
          )}
          {typeof media.progress === "number" && media.progress > 0 && (
            <span className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
              <span
                className="block h-full bg-primary"
                style={{ width: `${Math.min(media.progress, 1) * 100}%` }}
              />
            </span>
          )}
          {media.votes > 0 && (
            <span className="absolute inset-x-0 bottom-3 mx-auto inline-flex w-fit items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm">
              <StarFilled size={15} className="text-warning" />
              {media.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-2.5 px-0.5">
          <h3 className="truncate text-sm font-medium text-foreground-strong">
            {media.title}
          </h3>
          {media.year && (
            <p className="mt-0.5 text-xs text-foreground-muted">{media.year}</p>
          )}
        </div>
      </Link>

      <FavoriteButton
        mediaType={media.type}
        tmdbId={media.id}
        title={media.title}
        className="absolute end-2 top-2 z-10"
      />
    </div>
  );
}
