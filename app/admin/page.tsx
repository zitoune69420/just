import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@appica/ui-react/skeleton";
import { AdminUsers } from "@/components/admin-users";
import { currentAdmin } from "@/lib/admin";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Administration",
};

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full rounded-full" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

function parsePage(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

async function AdminHeader() {
  const t = await getTranslator();
  return (
    <header className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("admin.title")}
      </h1>
      <p className="text-sm text-foreground-muted">{t("admin.description")}</p>
    </header>
  );
}

async function AdminGate({ query, page }: { query?: string; page: number }) {
  if (!(await currentAdmin())) notFound();
  return <AdminUsers query={query} page={page} />;
}

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-16 w-full rounded-2xl" />}>
        <AdminHeader />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        {searchParams.then(({ q, page }) => (
          <AdminGate query={q} page={parsePage(page)} />
        ))}
      </Suspense>
    </div>
  );
}
