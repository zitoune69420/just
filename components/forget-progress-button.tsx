"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@appica/ui-react/tooltip";
import { EyeCheck } from "@appica/icons-react";
import { forgetProgress } from "@/lib/progress-actions";
import type { MediaType } from "@/lib/types";
import { useTranslations } from "./i18n-provider";

export function ForgetProgressButton({
  mediaType,
  tmdbId,
  title,
  className = "",
}: {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  className?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await forgetProgress(mediaType, tmdbId);
      router.refresh();
    });
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-busy={pending}
            aria-label={t("detail.markWatchedLabel", { title })}
            onClick={handleClick}
            disabled={pending}
            className={`grid size-8 place-items-center rounded-full bg-black/60 text-white ring-1 ring-white/15 backdrop-blur-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60 [@media(hover:hover)]:hover:bg-black/75 ${className}`}
          >
            <EyeCheck size={17} />
          </button>
        }
      />
      <TooltipContent>{t("detail.markWatched")}</TooltipContent>
    </Tooltip>
  );
}
