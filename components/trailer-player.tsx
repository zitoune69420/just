"use client";

import { useState } from "react";
import Image from "next/image";
import { PlayerPlayFilled } from "@appica/icons-react";
import { tmdbImage } from "@/lib/media";

interface TrailerPlayerProps {
  videoKey: string;
  title: string;
  backdrop: string | null;
}

/**
 * Lecteur « lite » : affiche la miniature et ne charge l'iframe YouTube
 * qu'au clic, pour ne pas alourdir le chargement initial.
 */
export function TrailerPlayer({ videoKey, title, backdrop }: TrailerPlayerProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl bg-black ring-1 ring-border/50">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
          title={`Bande-annonce : ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Lire la bande-annonce : ${title}`}
          className="group absolute inset-0 cursor-pointer"
        >
          {backdrop && (
            <Image
              src={tmdbImage(backdrop, "w1280")}
              alt=""
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-cover opacity-70 transition-opacity group-hover:opacity-60"
            />
          )}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-16 place-items-center rounded-full bg-white text-neutral-950 shadow-lg transition-transform duration-200 ease-out group-hover:scale-105 group-active:scale-95 motion-reduce:group-hover:scale-100">
              <PlayerPlayFilled size={30} className="translate-x-0.5" />
            </span>
          </span>
          <span className="absolute start-5 bottom-4 text-sm font-medium text-white">
            Bande-annonce
          </span>
        </button>
      )}
    </div>
  );
}
