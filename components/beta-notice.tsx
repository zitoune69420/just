"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@appica/ui-react/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@appica/ui-react/dialog";
import { Tools } from "@appica/icons-react";
import {
  dismissNotice,
  getDismissedSnapshot,
  getServerDismissed,
  subscribeDismissed,
} from "@/lib/notice-store";
import { useTranslations } from "./i18n-provider";

const NOTICE_ID = "foundation-2026";

/** Avertissement de catalogue incomplet, montré une fois puis mémorisé. */
export function BetaNotice() {
  const t = useTranslations();
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getServerDismissed,
  );

  const open = !dismissed.includes(NOTICE_ID);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismissNotice(NOTICE_ID);
      }}
    >
      <DialogContent className="w-full max-w-md border-border-overlay">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-background-muted text-foreground-subtle">
            <Tools size={28} />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {t("notice.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground-muted">
            {t("notice.body")}
          </DialogDescription>
          <div className="flex justify-center pt-1">
            <Button
              className="rounded-full px-8"
              onClick={() => dismissNotice(NOTICE_ID)}
            >
              {t("notice.dismiss")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
