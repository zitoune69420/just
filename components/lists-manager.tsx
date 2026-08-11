"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@appica/ui-react/button";
import { Input } from "@appica/ui-react/input";
import { Switch } from "@appica/ui-react/switch";
import { Textarea } from "@appica/ui-react/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@appica/ui-react/tooltip";
import { Copy, Plus, Trash } from "@appica/icons-react";
import {
  createListAction,
  deleteListAction,
  updateListAction,
} from "@/lib/list-actions";
import { plural } from "@/lib/i18n/translate";
import { DESCRIPTION_MAX, TITLE_MAX, type MediaList } from "@/lib/lists";
import { useTranslations } from "./i18n-provider";

function shareUrl(slug: string): string {
  return `${window.location.origin}/list/${slug}`;
}

function CreateForm() {
  const t = useTranslations();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (title.trim().length === 0) return;

    startTransition(async () => {
      const result = await createListAction(title, description);
      if (result.ok) {
        setTitle("");
        setDescription("");
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-3xl border border-border bg-background-subtle p-5"
    >
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={TITLE_MAX}
        placeholder={t("lists.titlePlaceholder")}
        aria-label={t("lists.titleLabel")}
      />
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={DESCRIPTION_MAX}
        rows={2}
        placeholder={t("lists.descriptionPlaceholder")}
        aria-label={t("lists.descriptionLabel")}
      />
      <Button
        type="submit"
        size="sm"
        className="rounded-full"
        disabled={pending || title.trim().length === 0}
        aria-busy={pending}
      >
        <Plus size={16} /> {t("lists.create")}
      </Button>
    </form>
  );
}

function ListRow({ list }: { list: MediaList }) {
  const t = useTranslations();
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(list.isPublic);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleVisibility(next: boolean) {
    setIsPublic(next);
    startTransition(async () => {
      const result = await updateListAction(list.id, { isPublic: next });
      if (!result.ok) setIsPublic(!next);
      router.refresh();
    });
  }

  function handleCopy() {
    void navigator.clipboard.writeText(shareUrl(list.slug)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteListAction(list.id);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center gap-4 py-4">
      <div className="min-w-0 flex-1">
        <Link
          href={`/list/${list.slug}`}
          className="truncate text-sm font-medium text-foreground-strong outline-none hover:underline focus-visible:underline"
        >
          {list.title}
        </Link>
        <p className="mt-0.5 truncate text-xs text-foreground-muted">
          {plural(t, "lists.count", list.count ?? 0)}
          {list.description ? ` · ${list.description}` : ""}
        </p>
      </div>

      <label className="flex items-center gap-2 text-xs text-foreground-muted">
        <Switch
          checked={isPublic}
          onCheckedChange={handleVisibility}
          disabled={pending}
        />
        {t(isPublic ? "lists.public" : "lists.private")}
      </label>

      {/* Copier l'adresse n'a de sens que si le destinataire pourra l'ouvrir. */}
      {isPublic && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                className="rounded-full"
                onClick={handleCopy}
                aria-label={t("lists.copyLink")}
              >
                <Copy size={15} />
              </Button>
            }
          />
          <TooltipContent>
            {t(copied ? "lists.copied" : "lists.copyLink")}
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={handleDelete}
              disabled={pending}
              aria-label={t("lists.deleteLabel", { title: list.title })}
            >
              <Trash size={15} />
            </Button>
          }
        />
        <TooltipContent>{t("lists.delete")}</TooltipContent>
      </Tooltip>
    </li>
  );
}

export function ListsManager({ lists }: { lists: MediaList[] }) {
  const t = useTranslations();

  return (
    <div className="space-y-8">
      <CreateForm />

      {lists.length === 0 ? (
        <p className="py-10 text-center text-sm text-foreground-muted">
          {t("lists.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {lists.map((list) => (
            <ListRow key={list.id} list={list} />
          ))}
        </ul>
      )}
    </div>
  );
}
