import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@appica/ui-react/skeleton";
import { AccountPanel } from "@/components/account-panel";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "My account",
};

function AccountSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-3xl" />
      <Skeleton className="h-80 w-full rounded-3xl" />
      <Skeleton className="h-40 w-full rounded-3xl" />
    </div>
  );
}

async function AccountHeader() {
  const t = await getTranslator();
  return (
    <header className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("account.title")}
      </h1>
      <p className="text-sm text-foreground-muted">
        {t("account.description")}
      </p>
    </header>
  );
}

export default function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <AccountHeader />
      </Suspense>

      <Suspense fallback={<AccountSkeleton />}>
        {searchParams.then(({ error }) => (
          <AccountPanel error={error} />
        ))}
      </Suspense>
    </div>
  );
}
