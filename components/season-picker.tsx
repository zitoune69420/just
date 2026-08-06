"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@appica/ui-react/select";
import { Spinner } from "@appica/ui-react/spinner";
import { PlayerPlayFilled } from "@appica/icons-react";
import { tmdbImage } from "@/lib/media";
import type { Episode, Season } from "@/lib/types";
import {
  requestPlayback,
  type PlaybackDenied,
} from "@/lib/playback-client";
import { recordProgress } from "@/lib/progress-actions";
import { AccessDialog } from "./access-dialog";
import { WatchDialog } from "./watch-button";

const OVERVIEW_MAX = 90;

function shorten(text: string): string {
  if (text.length <= OVERVIEW_MAX) return text;
  const cut = text.slice(0, OVERVIEW_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function SeasonPicker({
  tvId,
  seasons,
  initialSeason,
  available = true,
}: {
  tvId: number;
  seasons: Season[];
  initialSeason?: number | null;
  available?: boolean;
}) {
  const [season, setSeason] = useState(
    initialSeason ?? seasons[0]?.number ?? 1,
  );
  const [loaded, setLoaded] = useState<{
    season: number;
    episodes: Episode[];
  } | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [denied, setDenied] = useState<PlaybackDenied | null>(null);
  const [pending, setPending] = useState<number | null>(null);

  const loading = loaded?.season !== season;
  const episodes = loaded?.season === season ? loaded.episodes : [];

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(
          `/api/season?tv=${tvId}&season=${season}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as { episodes?: Episode[] };
        if (!cancelled) setLoaded({ season, episodes: data.episodes ?? [] });
      } catch {
        if (!cancelled) setLoaded({ season, episodes: [] });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [tvId, season]);

  const canPlay = available;

  async function play(number: number) {
    if (pending !== null) return;
    setPending(number);
    const result = await requestPlayback("tv", tvId, season, number);
    setPending(null);

    if ("url" in result) {
      void recordProgress("tv", tvId, season, number);
      setSrc(result.url);
      setPlaying(number);
      return;
    }
    setDenied(result.denied);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
          Épisodes
        </h2>
        <Select
          value={season}
          onValueChange={(value) => setSeason(Number(value))}
        >
          <SelectTrigger className="w-52">
            <SelectValue>
              {(value: number) =>
                seasons.find((item) => item.number === value)?.name ??
                `Saison ${value}`
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {seasons.map((item) => (
              <SelectItem key={item.number} value={item.number}>
                {item.name}
                <span className="text-foreground-subtle">
                  {" "}
                  · {item.episodeCount} ép.
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Spinner className="text-3xl" />
        </div>
      ) : episodes.length === 0 ? (
        <p className="py-10 text-center text-sm text-foreground-muted">
          Aucun épisode pour cette saison.
        </p>
      ) : (
        <ul className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2">
          {episodes.map((episode) => (
            <li key={episode.number} className="min-w-0">
              <button
                type="button"
                disabled={!canPlay}
                onClick={() => void play(episode.number)}
                className="press group flex h-full w-full gap-3 rounded-2xl border border-border/60 bg-background-subtle/60 p-2.5 text-start outline-none transition-colors hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
              >
                <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl bg-background-muted">
                  {episode.still && (
                    <Image
                      src={tmdbImage(episode.still, "w300")}
                      alt=""
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  )}
                  {canPlay && (
                    <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <PlayerPlayFilled size={24} className="text-white" />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 space-y-1 overflow-hidden py-0.5">
                  <span className="block truncate text-sm font-medium text-foreground-strong">
                    {episode.number}. {episode.title}
                  </span>
                  {episode.facts.length > 0 && (
                    <span className="block text-xs text-foreground-muted">
                      {episode.facts.join(" · ")}
                    </span>
                  )}
                  {episode.overview && (
                    <span className="line-clamp-2 block text-xs text-foreground-subtle">
                      {shorten(episode.overview)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {src && (
        <WatchDialog
          src={src}
          open={playing !== null}
          onOpenChange={(next) => {
            if (!next) {
              setPlaying(null);
              setSrc(null);
            }
          }}
          track={{
            type: "tv",
            id: tvId,
            season,
            episode: playing,
            runtime:
              episodes.find((item) => item.number === playing)?.runtime ?? null,
          }}
        />
      )}

      <AccessDialog denied={denied} onClose={() => setDenied(null)} />
    </section>
  );
}
