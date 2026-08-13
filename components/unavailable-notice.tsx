"use client";

import { useState } from "react";
import { Button } from "@appica/ui-react/button";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import { AlertTriangle } from "@appica/icons-react";
import { useTranslations } from "./i18n-provider";

/**
 * Avertissement affiché à l'ouverture d'une fiche marquée indisponible par
 * l'administration.
 *
 * Le composant n'est monté que lorsque le drapeau est levé : c'est le serveur
 * qui décide, pas lui. Il s'ouvre donc d'emblée, sans effet ni requête.
 */
export function UnavailableNotice() {
  const t = useTranslations();
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full max-w-md border-border-overlay bg-background [&>[data-slot=dialog-content]]:px-6">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-md bg-background-muted">
            <AlertTriangle size={24} className="text-warning" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("unavailable.title")}
            </h2>
            <p className="text-sm text-foreground-muted">
              {t("unavailable.body")}
            </p>
          </div>
          <Button className="rounded-full" onClick={() => setOpen(false)}>
            {t("unavailable.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
