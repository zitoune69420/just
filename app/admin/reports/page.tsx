import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@appica/ui-react/skeleton";
import { AdminReports } from "@/components/admin-reports";
import { currentAdmin } from "@/lib/admin";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Reports",
};

function TableSkeleton() {
  return <Skeleton className="h-96 w-full rounded-md" />;
}

async function ReportsHeader({ resolved }: { resolved: boolean }) {
  const t = await getTranslator();

  const tab = (active: boolean, href: string, label: string) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-background-muted text-foreground-strong"
          : "text-foreground-muted hover:text-foreground-strong"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("admin.reportsTitle")}
        </h1>
        <p className="text-sm text-foreground-muted">
          {t("admin.reportsDescription")}
        </p>
      </div>
      <nav className="flex items-center gap-1">
        {tab(!resolved, "/admin/reports", t("admin.reportsOpen"))}
        {tab(
          resolved,
          "/admin/reports?state=resolved",
          t("admin.reportsResolved"),
        )}
        {tab(false, "/admin", t("admin.backToUsers"))}
      </nav>
    </header>
  );
}

async function ReportsGate({ resolved }: { resolved: boolean }) {
  if (!(await currentAdmin())) notFound();
  return <AdminReports resolved={resolved} />;
}

export default function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-md" />}>
        {searchParams.then(({ state }) => (
          <ReportsHeader resolved={state === "resolved"} />
        ))}
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        {searchParams.then(({ state }) => (
          <ReportsGate resolved={state === "resolved"} />
        ))}
      </Suspense>
    </div>
  );
}
