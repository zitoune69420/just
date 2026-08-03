"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import { PlayerPlayFilled } from "@appica/icons-react";

export const WATCH_ANCHOR = "regarder";

export function WatchButton({
  id,
}: {
  id: number;
}) {
  const [open, setOpen] = useState(false);

  if (!id) {
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
        onClick={() => setOpen(true)}
      >
        <PlayerPlayFilled size={20} /> Regarder
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-full max-w-[min(72rem,calc((100dvh-2rem)*16/9))] overflow-hidden border-border-overlay bg-background p-0 [&>[data-slot=dialog-content]]:pt-0! [&>[data-slot=dialog-content]]:pb-0!"
        >
          <div className="aspect-video w-full">
              <iframe
                src={`https://vidsrc.tw/embed/movie?tmdb=${id}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="size-full border-0"
              />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
