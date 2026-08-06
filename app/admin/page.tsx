import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@appica/ui-react/skeleton";
import { AdminUsers } from "@/components/admin-users";
import { currentAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Administration",
  description: "Comptes utilisateurs.",
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
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Administration
        </h1>
        <p className="text-sm text-foreground-muted">
          Index des comptes et modification des informations.
        </p>
      </header>

      <Suspense fallback={<TableSkeleton />}>
        {searchParams.then(({ q, page }) => (
          <AdminGate query={q} page={parsePage(page)} />
        ))}
      </Suspense>
    </div>
  );
}
