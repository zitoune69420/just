"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import { PlayerPlayFilled } from "@appica/icons-react";

export const WATCH_ANCHOR = "regarder";

const STREAM_BASE_URL = process.env.NEXT_PUBLIC_STREAM_BASE_URL;

export function streamUrl(
  id: number,
  season: number | null,
  episode: number | null,
): string | null {
  if (!STREAM_BASE_URL) return null;
  const base = STREAM_BASE_URL.replace(/\/+$/, "");
  if (season !== null && episode !== null) {
    return `${base}/tv?tmdb=${id}&season=${season}&episode=${episode}`;
  }
  return `${base}/movie?tmdb=${id}`;
}

export function WatchDialog({
  src,
  open,
  onOpenChange,
}: {
  src: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
  season = null,
  episode = null,
}: {
  id: number;
  season?: number | null;
  episode?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const src = streamUrl(id, season, episode);

  if (!src) {
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
      <Button size="lg" className="rounded-full" onClick={() => setOpen(true)}>
        <PlayerPlayFilled size={20} /> Regarder
      </Button>

      <WatchDialog src={src} open={open} onOpenChange={setOpen} />
    </>
  );
}
