"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import { PlayerPlayFilled, PlayerTrackNext } from "@appica/icons-react";
import {
  fetchSeasonEpisodes,
  nextEpisodeAfter,
  type NextEpisode,
} from "@/lib/next-episode";
import {
  requestPlayback,
  type PlaybackDenied,
} from "@/lib/playback-client";
import { recordProgress } from "@/lib/progress-actions";
import type { MediaType, Season } from "@/lib/types";
import { useTranslations } from "./i18n-provider";
import { AccessDialog } from "./access-dialog";

export const WATCH_ANCHOR = "regarder";

export interface WatchTrack {
  type: MediaType;
  id: number;
  season: number | null;
  episode: number | null;
  runtime: number | null;
}

export interface NextUp {
  label: string;
  onPlay: () => void;
  pending?: boolean;
}

const TICK_MS = 60_000;

const MIN_FLUSH_SECONDS = 10;

function useWatchTimer(open: boolean, track: WatchTrack | undefined) {
  const type = track?.type;
  const id = track?.id;
  const season = track?.season ?? null;
  const episode = track?.episode ?? null;
  const runtime = track?.runtime ?? null;

  useEffect(() => {
    if (!open || !type || !id) return;

    let pending = 0;
    let since: number | null =
      document.visibilityState === "visible" ? Date.now() : null;

    function collect() {
      if (since === null) return;
      pending += Date.now() - since;
      since = Date.now();
    }

    function send(beacon: boolean) {
      collect();
      const seconds = Math.round(pending / 1000);
      if (seconds < MIN_FLUSH_SECONDS) return;
      pending = 0;

      const payload = JSON.stringify({
        mediaType: type,
        tmdbId: id,
        season,
        episode,
        seconds,
        durationSeconds: runtime !== null ? runtime * 60 : null,
      });

      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/progress",
          new Blob([payload], { type: "application/json" }),
        );
        return;
      }

      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        since = Date.now();
        return;
      }
      send(true);
      since = null;
    }

    function onPageHide() {
      send(true);
    }

    const interval = setInterval(() => send(false), TICK_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      send(true);
    };
  }, [open, type, id, season, episode, runtime]);
}

export function WatchDialog({
  src,
  open,
  onOpenChange,
  track,
  next,
}: {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: WatchTrack;
  next?: NextUp | null;
}) {
  const t = useTranslations();
  useWatchTimer(open, track);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[min(72rem,calc((100dvh-2rem)*16/9))] overflow-hidden border-border-overlay bg-background p-0 [&>[data-slot=dialog-content]]:pt-0! [&>[data-slot=dialog-content]]:pb-0!">
        <div className="aspect-video w-full">
          {/**
           * Pas d'attribut `sandbox` ici : le lecteur vient d'une origine
           * tierce et détecte l'encadrement bridé, il refuse alors de démarrer.
           * Même la liste permissive (`allow-scripts allow-same-origin
           * allow-forms allow-modals allow-popups …`) ne suffisait pas, et
           * `allow-scripts` + `allow-same-origin` réunis annulent de toute
           * façon l'essentiel de l'isolement.
           *
           * Ce qui protège encore : l'iframe reste sur son origine à elle,
           * donc hors de portée de nos cookies (`SameSite`, `HttpOnly`) ; la
           * `Permissions-Policy` de l'app coupe caméra, micro et géoloc ; et
           * `referrerPolicy="no-referrer"` empêche la fuite de l'URL de la
           * fiche. Le risque résiduel assumé est la redirection de l'onglet
           * par le lecteur (hameçonnage), inhérent à ce type d'embed.
           */}
          <iframe
            src={src}
            referrerPolicy="no-referrer"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
        {next && (
          <div className="flex items-center justify-between gap-3 border-t border-border-overlay bg-background px-4 py-3">
            <p className="min-w-0 truncate text-sm text-foreground-muted">
              {t("detail.upNext", { label: next.label })}
            </p>
            <Button
              size="sm"
              className="shrink-0 rounded-full"
              onClick={next.onPlay}
              disabled={next.pending}
            >
              <PlayerTrackNext size={16} /> {t("detail.nextEpisode")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function WatchButton({
  id,
  type,
  season = null,
  episode = null,
  runtime = null,
  seasons = [],
  resumed = false,
  advanced = false,
  available = true,
}: {
  id: number;
  type: MediaType;
  season?: number | null;
  episode?: number | null;
  runtime?: number | null;
  seasons?: Season[];
  resumed?: boolean;
  /** La cible est l'épisode d'après, pas celui laissé en cours : on ne « reprend » pas. */
  advanced?: boolean;
  available?: boolean;
}) {
  const t = useTranslations();
  const [src, setSrc] = useState<string | null>(null);
  const [denied, setDenied] = useState<PlaybackDenied | null>(null);
  const [pending, setPending] = useState(false);
  const [current, setCurrent] = useState({ season, episode, runtime });
  const [next, setNext] = useState<NextEpisode | null>(null);

  async function play(
    nextSeason: number | null,
    nextEpisode: number | null,
    nextRuntime: number | null,
  ) {
    if (pending) return;
    setPending(true);
    const result = await requestPlayback(type, id, nextSeason, nextEpisode);
    setPending(false);

    if (!("url" in result)) {
      setDenied(result.denied);
      return;
    }

    void recordProgress(type, id, nextSeason, nextEpisode);
    setCurrent({
      season: nextSeason,
      episode: nextEpisode,
      runtime: nextRuntime,
    });
    setSrc(result.url);

    if (type !== "tv" || nextSeason === null || nextEpisode === null) {
      setNext(null);
      return;
    }

    const episodes = await fetchSeasonEpisodes(id, nextSeason);
    setNext(nextEpisodeAfter(seasons, nextSeason, nextEpisode, episodes));
  }

  if (!available) {
    return (
      <Button
        size="lg"
        className="rounded-full"
        render={<Link href={`#${WATCH_ANCHOR}`} />}
      >
        <PlayerPlayFilled size={20} /> {t("detail.watch")}
      </Button>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="rounded-full"
        onClick={() => void play(season, episode, runtime)}
        disabled={pending}
      >
        <PlayerPlayFilled size={20} />
        {resumed && season !== null && episode !== null
          ? t(advanced ? "detail.playNext" : "detail.resume", {
              season,
              episode,
            })
          : resumed
            ? t("detail.rewatch")
            : t("detail.watch")}
      </Button>

      {src && (
        <WatchDialog
          src={src}
          open={src !== null}
          onOpenChange={(open) => {
            if (!open) {
              setSrc(null);
              setNext(null);
            }
          }}
          track={{
            type,
            id,
            season: current.season,
            episode: current.episode,
            runtime: current.runtime,
          }}
          next={
            next && {
              label: next.label,
              pending,
              onPlay: () =>
                void play(next.season, next.episode, next.runtime),
            }
          }
        />
      )}

      <AccessDialog denied={denied} onClose={() => setDenied(null)} />
    </>
  );
}
