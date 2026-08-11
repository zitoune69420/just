"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@appica/ui-react/alert-dialog";
import { Button } from "@appica/ui-react/button";
import { Trash } from "@appica/icons-react";
import { forgetAllProgress } from "@/lib/progress-actions";
import { useTranslations } from "./i18n-provider";

/**
 * L'effacement ne se rejoue pas : il passe par une confirmation explicite, pas
 * par un simple clic sur une icône.
 */
export function ClearHistoryButton() {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await forgetAllProgress();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" className="rounded-full">
            <Trash size={16} /> {t("history.clearAll")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("history.clearTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("history.clearHint")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose
            render={
              <Button variant="outline" size="sm" className="rounded-full">
                {t("history.clearCancel")}
              </Button>
            }
          />
          <Button
            variant="destructive"
            size="sm"
            className="rounded-full"
            onClick={handleConfirm}
            disabled={pending}
            aria-busy={pending}
          >
            {t("history.clearConfirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
