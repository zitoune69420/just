"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@appica/ui-react/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@appica/ui-react/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@appica/ui-react/tooltip";
import { Plus } from "@appica/icons-react";
import { toggleListItemAction } from "@/lib/list-actions";
import type { MediaList } from "@/lib/lists";
import type { MediaType } from "@/lib/types";
import { useTranslations } from "./i18n-provider";

export function AddToList({
  mediaType,
  tmdbId,
  lists,
  containing,
}: {
  mediaType: MediaType;
  tmdbId: number;
  lists: MediaList[];
  /** Identifiants des listes contenant déjà ce titre, calculés côté serveur. */
  containing: string[];
}) {
  const t = useTranslations();
  const router = useRouter();
  const [present, setPresent] = useState<ReadonlySet<string>>(
    () => new Set(containing),
  );
  const [pending, startTransition] = useTransition();

  function toggle(listId: string) {
    const next = !present.has(listId);

    setPresent((current) => {
      const updated = new Set(current);
      if (next) {
        updated.add(listId);
      } else {
        updated.delete(listId);
      }
      return updated;
    });

    startTransition(async () => {
      const result = await toggleListItemAction(
        listId,
        mediaType,
        tmdbId,
        next,
      );
      if (!result.ok) {
        // L'écriture a échoué : on remet la case dans son état d'avant.
        setPresent((current) => {
          const updated = new Set(current);
          if (next) {
            updated.delete(listId);
          } else {
            updated.add(listId);
          }
          return updated;
        });
        return;
      }
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="rounded-full"
                  aria-busy={pending}
                  aria-label={t("lists.addTo")}
                >
                  <Plus size={20} />
                </Button>
              }
            />
          }
        />
        <TooltipContent>{t("lists.addTo")}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="start" className="w-60">
        {lists.length === 0 ? (
          <DropdownMenuItem disabled>{t("lists.noLists")}</DropdownMenuItem>
        ) : (
          lists.map((list) => (
            <DropdownMenuCheckboxItem
              key={list.id}
              checked={present.has(list.id)}
              closeOnClick={false}
              onCheckedChange={() => toggle(list.id)}
            >
              <span className="truncate">{list.title}</span>
            </DropdownMenuCheckboxItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/lists" />}>
          {t("lists.manage")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
