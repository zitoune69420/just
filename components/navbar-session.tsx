import Link from "next/link";
import { Button } from "@appica/ui-react/button";
import { isDiscordConfigured } from "@/lib/discord";
import { getSession } from "@/lib/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { findUserById } from "@/lib/users";
import { SessionMenu } from "./session-menu";

async function hasDiscordLink(userId: string): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return true;
  try {
    const user = await findUserById(userId);
    return Boolean(user?.discord_id);
  } catch {
    return true;
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
    return (
      <SessionMenu
        name={user.name}
        avatar={user.avatar}
        canLinkDiscord={isDiscordConfigured() && !(await hasDiscordLink(user.id))}
      />
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-full"
        render={<Link href="/login" />}
      >
        Connexion
      </Button>
      <Button
        size="sm"
        className="rounded-full max-sm:hidden"
        render={<Link href="/login?mode=signup" />}
      >
        S’inscrire gratuitement
      </Button>
    </>
  );
}
