import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { Skeleton } from "@appica/ui-react/skeleton";
import { ChevronLeft } from "@appica/icons-react";
import { AdminUserForm } from "@/components/admin-user-form";
import { currentAdmin } from "@/lib/admin";
import { getTranslator } from "@/lib/i18n/server";
import { findUserById } from "@/lib/users";

export const metadata: Metadata = {
  title: "Edit account",
};

async function UserEditor({ id }: { id: string }) {
  if (!(await currentAdmin())) notFound();

  const t = await getTranslator();

  const user = await findUserById(id).catch(() => null);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="soft" className="rounded-full">
          {t(user.discord_id ? "admin.discordLinked" : "admin.discordMissing")}
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {t(user.password_hash ? "admin.passwordSet" : "admin.passwordMissing")}
        </Badge>
      </div>

      <section className='max-w-sm'>
        <AdminUserForm
          id={user.id}
          name={user.name}
          email={user.email}
          role={user.role}
        />
      </section>
    </div>
  );
}

async function EditorHeader() {
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
        {t("admin.editTitle")}
      </h1>
    </div>
  );
}

export default function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<Skeleton className="h-20 w-full rounded-2xl" />}>
        <EditorHeader />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-3xl" />}>
        {params.then(({ id }) => (
          <UserEditor id={id} />
        ))}
      </Suspense>
    </div>
  );
}
