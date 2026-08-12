"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@appica/ui-react/button";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import { Lock } from "@appica/icons-react";
import { playbackMessageKey, type PlaybackDenied } from "@/lib/playback-client";
import { useTranslations } from "./i18n-provider";

export function AccessDialog({
  denied,
  onClose,
}: {
  denied: PlaybackDenied | null;
  onClose: () => void;
}) {
  const t = useTranslations();

  /**
   * Un visiteur sans compte n'a pas d'offre à consulter : on l'envoie se
   * connecter, et il revient sur la fiche qu'il essayait de lancer.
   */
  const anonymous = denied?.reason === "anonymous";
  const returnTo = usePathname();

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
            {t("playback.accessTitle")}
          </h2>
          <p className="text-sm text-foreground-muted">
            {denied ? t(playbackMessageKey(denied)) : ""}
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={onClose}
            >
              {t("playback.close")}
            </Button>
            {anonymous ? (
              <Button
                className="rounded-full"
                render={
                  <Link
                    href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
                  />
                }
              >
                {t("session.signIn")}
              </Button>
            ) : (
              <Button className="rounded-full" render={<Link href="/account" />}>
                {t("playback.myPlan")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
