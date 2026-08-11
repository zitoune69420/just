"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@appica/ui-react/avatar";
import { Button } from "@appica/ui-react/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@appica/ui-react/dropdown-menu";
import { Heart, Logout, Settings, Users } from "@appica/icons-react";
import { logout } from "@/lib/auth-actions";
import type { Role } from "@/lib/roles";
import { DiscordMark, discordSignInHref } from "./discord-sign-in";
import { useTranslations } from "./i18n-provider";
import { LocaleMenuItems } from "./locale-picker";
import { RoleBadge } from "./role-badge";

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export function SessionMenu({
  name,
  avatar,
  canLinkDiscord = false,
  isAdmin = false,
  role = "user",
}: {
  name: string;
  avatar: string | null;
  canLinkDiscord?: boolean;
  isAdmin?: boolean;
  role?: Role;
}) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu size="sm">
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full ps-1 pe-3 max-md:pe-1"
            aria-label={t("session.account", { name })}
          >
            <Avatar size="xs" shape="circle">
              {avatar && <AvatarImage src={avatar} alt="" />}
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
            <span className="max-w-32 truncate text-sm font-medium max-md:hidden">
              {name}
            </span>
            <RoleBadge role={role} className="max-md:hidden" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 px-2.5 pt-1.5 pb-1 text-xs text-foreground-subtle">
          <span className="truncate">{name}</span>
        </div>
        <DropdownMenuItem render={<Link href="/favorites" />}>
          <Heart size={16} className="-ms-px" />
          {t("session.favorites")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account" />}>
          <Settings size={16} />
          {t("session.myAccount")}
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <Users size={16} />
            {t("session.admin")}
          </DropdownMenuItem>
        )}
        {canLinkDiscord && (
          <DropdownMenuItem
            render={<a href={discordSignInHref("/account")} />}
          >
            <DiscordMark size={16} className="text-[#5865F2]" />
            {t("session.linkDiscord")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuGroupLabel>
            {t("session.language")}
          </DropdownMenuGroupLabel>
          <LocaleMenuItems />
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onClick={() => startTransition(() => logout())}
        >
          <Logout size={16} />
          {t("session.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
