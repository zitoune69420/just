"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Switch } from "@appica/ui-react/switch";
import { markTitleUnavailable } from "@/lib/report-actions";
import type { MediaType } from "@/lib/types";
import { useTranslations } from "./i18n-provider";

/**
 * Bascule l'avertissement affiché aux comptes sur la fiche du titre.
 *
 * L'état bascule tout de suite et revient en arrière si l'écriture échoue :
 * l'action est fréquente et sans risque, attendre le serveur rendrait le
 * tableau poussif.
 */
export function UnavailableSwitch({
  mediaType,
  tmdbId,
  unavailable,
}: {
  mediaType: MediaType;
  tmdbId: number;
  unavailable: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [checked, setChecked] = useState(unavailable);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const result = await markTitleUnavailable(mediaType, tmdbId, next);
      if (!result.ok) {
        setChecked(!next);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Switch
      checked={checked}
      disabled={pending}
      onCheckedChange={change}
      aria-label={t("admin.reportMarkUnavailable")}
    />
  );
}
