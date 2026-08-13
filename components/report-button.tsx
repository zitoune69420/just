"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { Dialog, DialogContent } from "@appica/ui-react/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@appica/ui-react/tooltip";
import { AlertTriangle, Check, Flag } from "@appica/icons-react";
import { reportTitle } from "@/lib/report-actions";
import { REPORT_REASONS, type ReportReason } from "@/lib/reports";
import type { MessageKey } from "@/lib/i18n/translate";
import type { MediaType } from "@/lib/types";
import { useTranslations } from "./i18n-provider";

/** Ce que l'envoi a donné, ou `null` tant que rien n'a été tenté. */
type Outcome =
  | { kind: "done"; messageKey: MessageKey }
  | { kind: "failed"; messageKey: MessageKey };

function reasonKeys(reason: ReportReason): {
  label: MessageKey;
  hint: MessageKey;
} {
  return {
    label: `report.reason.${reason}` as MessageKey,
    hint: `report.reason.${reason}Hint` as MessageKey,
  };
}

export function ReportButton({
  mediaType,
  tmdbId,
  season = null,
  episode = null,
  className = "",
}: {
  mediaType: MediaType;
  tmdbId: number;
  season?: number | null;
  episode?: number | null;
  className?: string;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("unavailable");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await reportTitle(
        mediaType,
        tmdbId,
        reason,
        season,
        episode,
      );

      if (result.ok) {
        setOutcome({
          kind: "done",
          messageKey: result.duplicate ? "report.duplicate" : "report.done",
        });
        return;
      }

      setOutcome({
        kind: "failed",
        messageKey:
          result.reason === "unauthenticated"
            ? "report.signInRequired"
            : result.reason === "throttled"
              ? "report.throttled"
              : "report.error",
      });
    });
  }

  /** Rouvrir après un envoi doit repartir d'un formulaire propre. */
  function change(next: boolean) {
    setOpen(next);
    if (!next) setOutcome(null);
  }

  return (
    <>
      {/**
       * Même gabarit que la croix de fermeture du dialogue de lecture, dont ce
       * bouton est voisin : `icon-sm` et `rounded-sm`.
       */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("report.open")}
              className={`rounded-sm ${className}`}
              onClick={() => change(true)}
            >
              <Flag size={16} />
            </Button>
          }
        />
        <TooltipContent>{t("report.open")}</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={change}>
        {/**
         * Le rembourrage horizontal se pose ici parce que le dialogue ne fournit
         * que le vertical : l'horizontal est porté par `DialogHeader` et
         * `DialogBody`, dont ce formulaire n'a pas l'usage. `px-6` reprend la
         * valeur du `pt-6`/`pb-6` d'origine, pour un cadre régulier.
         */}
        <DialogContent className="w-full max-w-md border-border-overlay bg-background [&>[data-slot=dialog-content]]:px-6">
          {outcome ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-md bg-background-muted">
                {outcome.kind === "done" ? (
                  <Check size={24} className="text-success" />
                ) : (
                  <AlertTriangle size={24} className="text-warning" />
                )}
              </div>
              <p className="text-sm text-foreground-muted">
                {t(outcome.messageKey)}
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => change(false)}
                >
                  {t("playback.close")}
                </Button>
                {outcome.messageKey === "report.signInRequired" && (
                  <Button className="rounded-full" render={<Link href="/login" />}>
                    {t("session.signIn")}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  {t("report.title")}
                </h2>
                <p className="text-sm text-foreground-muted">
                  {t("report.description")}
                </p>
              </div>

              <fieldset className="flex flex-col gap-1.5">
                {REPORT_REASONS.map((value) => {
                  const keys = reasonKeys(value);
                  const checked = reason === value;
                  return (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                        checked
                          ? "border-foreground-strong bg-background-muted/60"
                          : "border-border/60 hover:bg-background-muted/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={value}
                        checked={checked}
                        onChange={() => setReason(value)}
                        className="mt-1 accent-foreground-strong"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground-strong">
                          {t(keys.label)}
                        </span>
                        <span className="block text-xs text-foreground-muted">
                          {t(keys.hint)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => change(false)}
                  disabled={pending}
                >
                  {t("report.cancel")}
                </Button>
                <Button
                  className="rounded-full"
                  onClick={submit}
                  disabled={pending}
                >
                  {pending ? t("report.pending") : t("report.submit")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
