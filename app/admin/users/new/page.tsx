import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@appica/ui-react/button";
import { Skeleton } from "@appica/ui-react/skeleton";
import { ChevronLeft } from "@appica/icons-react";
import { AdminCreateUserForm } from "@/components/admin-create-user-form";
import { currentAdmin } from "@/lib/admin";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "New account",
};

async function CreateGate() {
  if (!(await currentAdmin())) notFound();
  return <AdminCreateUserForm />;
}

async function NewUserHeader() {
  const t = await getTranslator();
  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        render={<Link href="/admin" />}
      >
        <ChevronLeft size={16} /> {t("admin.allAccounts")}
      </Button>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {t("admin.createTitle")}
      </h1>
      <p className="text-sm text-foreground-muted">{t("admin.createHint")}</p>
    </div>
  );
}

export default function AdminNewUserPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-2xl" />}>
        <NewUserHeader />
      </Suspense>

      <section className="max-w-sm">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
          <CreateGate />
        </Suspense>
      </section>
    </div>
  );
}
