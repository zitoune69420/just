import type { Metadata } from "next";
import { Suspense } from "react";
import { Badge } from "@appica/ui-react/badge";
import { DiscordSignInButton } from "@/components/discord-sign-in";
import { ListsManager } from "@/components/lists-manager";
import { GridSkeleton } from "@/components/skeletons";
import { getSession } from "@/lib/auth";
import { getTranslator } from "@/lib/i18n/server";
import { getUserLists } from "@/lib/lists";
import { isSupabaseAdminConfigured } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "My lists",
};

export default function ListsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<GridSkeleton count={3} />}>
        <ListsContent />
      </Suspense>
    </div>
  );
}

async function ListsContent() {
  const t = await getTranslator();
  const user = await getSession();

  const header = (
    <header className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("lists.title")}
      </h1>
      <p className="text-sm text-foreground-muted">
        {t("lists.descriptionLong")}
      </p>
    </header>
  );

  if (!user) {
    return (
      <>
        {header}
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-lg font-medium text-foreground-strong">
            {t("lists.signInRequired")}
          </p>
          <p className="max-w-sm text-sm text-foreground-muted">
            {t("lists.signInHint")}
          </p>
          <div className="mt-2">
            <DiscordSignInButton label={t("auth.discord")} returnTo="/lists" />
          </div>
        </div>
      </>
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <>
        {header}
        <div className="max-w-lg space-y-4 rounded-3xl border border-border bg-background-subtle p-8">
          <Badge variant="soft" className="rounded-full">
            {t("lists.configRequired")}
          </Badge>
          <p className="text-sm text-foreground-muted">{t("lists.configHint")}</p>
        </div>
      </>
    );
  }

  const lists = await getUserLists(user.id);

  return (
    <>
      {header}
      <ListsManager lists={lists} />
    </>
  );
}
