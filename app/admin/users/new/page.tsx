import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@appica/ui-react/button";
import { Skeleton } from "@appica/ui-react/skeleton";
import { ChevronLeft } from "@appica/icons-react";
import { AdminCreateUserForm } from "@/components/admin-create-user-form";
import { currentAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Nouveau compte",
};

async function CreateGate() {
  if (!(await currentAdmin())) notFound();
  return <AdminCreateUserForm />;
}

export default function AdminNewUserPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full"
          render={<Link href="/admin" />}
        >
          <ChevronLeft size={16} /> Tous les comptes
        </Button>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Nouveau compte
        </h1>
        <p className="text-sm text-foreground-muted">
          Le compte est créé avec un mot de passe, connectable immédiatement.
        </p>
      </div>

      <section className="max-w-sm">
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
          <CreateGate />
        </Suspense>
      </section>
    </div>
  );
}
