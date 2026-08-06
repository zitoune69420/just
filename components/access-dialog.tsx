"use client";

import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import { Lock } from "@appica/icons-react";
import { playbackMessage, type PlaybackDenied } from "@/lib/playback-client";

export function AccessDialog({
  denied,
  onClose,
}: {
  denied: PlaybackDenied | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={denied !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="w-full max-w-md border-border-overlay bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-background-muted text-foreground-subtle">
            <Lock size={24} />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Lecture indisponible
          </h2>
          <p className="text-sm text-foreground-muted">
            {denied ? playbackMessage(denied) : ""}
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={onClose}
            >
              Fermer
            </Button>
            <Button className="rounded-full" render={<Link href="/account" />}>
              Voir mon offre
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
