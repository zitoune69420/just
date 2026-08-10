import Link from "next/link";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { Input } from "@appica/ui-react/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@appica/ui-react/table";
import { ChevronLeft, ChevronRight, Plus, Search } from "@appica/icons-react";
import { listUsers, USERS_PAGE_SIZE } from "@/lib/admin";
import { fetchDiscordUsername } from "@/lib/discord";
import { getTranslator } from "@/lib/i18n/server";
import { plural } from "@/lib/i18n/translate";
import { roleLabelKey } from "@/lib/roles";
import { DiscordMark } from "./discord-sign-in";

function pageHref(query: string, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `/admin?${search}` : "/admin";
}

export async function AdminUsers({
  query = "",
  page = 1,
}: {
  query?: string;
  page?: number;
}) {
  const t = await getTranslator();
  const { users, total } = await listUsers({ query, page });
  const pages = Math.max(Math.ceil(total / USERS_PAGE_SIZE), 1);

  const usernames = await Promise.all(
    users.map((user) =>
      user.discord_id
        ? (user.discord_username ?? fetchDiscordUsername(user.discord_id))
        : null,
    ),
  );

  return (
    <div className="space-y-6">
      <form action="/admin" className="flex gap-2">
        <Input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={t("admin.searchPlaceholder")}
          startSlot={<Search size={16} />}
          className="flex-1"
        />
        <Button type="submit" className="rounded-full">
          {t("admin.search")}
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          render={<Link href="/admin/users/new" />}
        >
          <Plus size={16} /> {t("admin.new")}
        </Button>
      </form>

      <p className="text-sm text-foreground-muted">
        {plural(t, "admin.accountCount", total)}
      </p>

      {users.length === 0 ? (
        <p className="py-16 text-center text-sm text-foreground-muted">
          {t("admin.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table className='border-0'>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.name")}</TableHead>
                <TableHead>{t("admin.email")}</TableHead>
                <TableHead>{t("admin.role")}</TableHead>
                <TableHead>{t("admin.discord")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-foreground-strong">
                    {user.name}
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {user.email ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="soft" size="sm" className="rounded-full">
                      {t(roleLabelKey(user.role))}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {user.discord_id ? (
                      <a
                        href={`https://discord.com/users/${user.discord_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full text-foreground-strong underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <DiscordMark size={14} className="text-[#5865F2]" />
                        {usernames[index] ? `@${usernames[index]}` : t("admin.linkedAccount")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      render={<Link href={`/admin/users/${user.id}`} />}
                    >
                      {t("admin.edit")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 && (
        <nav
          aria-label={t("catalog.pagination")}
          className="flex items-center justify-center gap-4"
        >
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={page <= 1}
            render={
              page > 1 ? <Link href={pageHref(query, page - 1)} /> : undefined
            }
          >
            <ChevronLeft size={16} /> {t("catalog.previous")}
          </Button>
          <span className="text-sm text-foreground-muted">
            {t("admin.page", { page, total: pages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={page >= pages}
            render={
              page < pages ? <Link href={pageHref(query, page + 1)} /> : undefined
            }
          >
            {t("catalog.next")} <ChevronRight size={16} />
          </Button>
        </nav>
      )}
    </div>
  );
}
