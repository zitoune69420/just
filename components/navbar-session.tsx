import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { isDiscordConfigured } from "@/lib/discord";
import { getTranslator } from "@/lib/i18n/server";
import type { Role } from "@/lib/roles";
import { LocaleToggle } from "./locale-picker";
import { getSession } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { findUserById } from "@/lib/users";
import { SessionMenu } from "./session-menu";

async function accountFlags(userId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { linked: true, admin: false, role: "user" as Role };
  }
  try {
    const user = await findUserById(userId);
    return {
      linked: Boolean(user?.discord_id),
      admin: user?.role === "admin",
      role: user?.role ?? ("user" as Role),
    };
  } catch {
    return { linked: true, admin: false, role: "user" as Role };
  }
}

export function NavbarSessionFallback() {
  return (
    <div
      aria-hidden="true"
      className="size-8 animate-pulse rounded-full bg-background-muted"
    />
  );
}

export async function NavbarSession() {
  const user = await getSession();

  if (user) {
    const flags = await accountFlags(user.id);
    return (
      <SessionMenu
        name={user.name}
        avatar={user.avatar}
        canLinkDiscord={isDiscordConfigured() && !flags.linked}
        isAdmin={flags.admin}
        role={flags.role}
      />
    );
  }

  const t = await getTranslator();

  return (
    <>
      <LocaleToggle />
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        render={<Link href="/login" />}
      >
        {t("session.signIn")}
      </Button>
      <Button
        size="sm"
        className="rounded-full max-sm:hidden"
        render={<Link href="/login?mode=signup" />}
      >
        {t("session.signUp")}
      </Button>
    </>
  );
}
