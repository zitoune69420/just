"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import { PlayerPlayFilled } from "@appica/icons-react";
import {
  requestPlayback,
  type PlaybackDenied,
} from "@/lib/playback-client";
import { recordProgress } from "@/lib/progress-actions";
import type { MediaType } from "@/lib/types";
import { AccessDialog } from "./access-dialog";

export const WATCH_ANCHOR = "regarder";

export interface WatchTrack {
  type: MediaType;
  id: number;
  season: number | null;
  episode: number | null;
  runtime: number | null;
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
}: {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: WatchTrack;
}) {
  useWatchTimer(open, track);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[min(72rem,calc((100dvh-2rem)*16/9))] overflow-hidden border-border-overlay bg-background p-0 [&>[data-slot=dialog-content]]:pt-0! [&>[data-slot=dialog-content]]:pb-0!">
        <div className="aspect-video w-full">
          <iframe
            src={src}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
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
  resumed = false,
  available = true,
}: {
  id: number;
  type: MediaType;
  season?: number | null;
  episode?: number | null;
  runtime?: number | null;
  resumed?: boolean;
  available?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [denied, setDenied] = useState<PlaybackDenied | null>(null);
  const [pending, setPending] = useState(false);

  async function play() {
    if (pending) return;
    setPending(true);
    const result = await requestPlayback(type, id, season, episode);
    setPending(false);

    if ("url" in result) {
      void recordProgress(type, id, season, episode);
      setSrc(result.url);
      return;
    }
    setDenied(result.denied);
  }

  if (!available) {
    return (
      <Button
        size="lg"
        className="rounded-full"
        render={<Link href={`#${WATCH_ANCHOR}`} />}
      >
        <PlayerPlayFilled size={20} /> Regarder
      </Button>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="rounded-full"
        onClick={() => void play()}
        disabled={pending}
      >
        <PlayerPlayFilled size={20} />
        {resumed && season !== null && episode !== null
          ? `Reprendre S${season} E${episode}`
          : resumed
            ? "Revoir"
            : "Regarder"}
      </Button>

      {src && (
        <WatchDialog
          src={src}
          open={src !== null}
          onOpenChange={(next) => {
            if (!next) setSrc(null);
          }}
          track={{ type, id, season, episode, runtime }}
        />
      )}

      <AccessDialog denied={denied} onClose={() => setDenied(null)} />
    </>
  );
}
