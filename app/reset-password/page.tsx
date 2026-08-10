import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@appica/ui-react/button";
import { Skeleton } from "@appica/ui-react/skeleton";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "New password",
};

async function Shell({ children }: { children: React.ReactNode }) {
  const t = await getTranslator();

  return (
    <div className="enter mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="space-y-6 rounded-3xl border border-border/60 bg-background-subtle/60 p-8 backdrop-blur-sm">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("reset.title")}
          </h1>
          <p className="text-sm text-foreground-muted">{t("reset.subtitle")}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

async function IncompleteLink() {
  const t = await getTranslator();
  return (
    <p className="text-sm text-foreground-muted">{t("reset.incompleteLink")}</p>
  );
}

async function RequestLinkButton() {
  const t = await getTranslator();
  return (
    <Button
      className="w-full rounded-full"
      render={<Link href="/forgot-password" />}
    >
      {t("reset.requestLink")}
    </Button>
  );
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <Shell>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </Shell>
      }
    >
      {searchParams.then(({ token }) => (
        <Shell>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="space-y-4">
              <IncompleteLink />
              <RequestLinkButton />
            </div>
          )}
        </Shell>
      ))}
    </Suspense>
  );
}
