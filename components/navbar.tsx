"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@appica/ui-react/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@appica/ui-react/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@appica/ui-react/tooltip";
import { Menu2, Search } from "@appica/icons-react";
import type { MessageKey } from "@/lib/i18n/translate";
import { CommandMenu } from "./command-menu";
import { useTranslations } from "./i18n-provider";
import { ThemeToggle } from "./theme-toggle";

/**
 * Films et séries tiennent dans une seule entrée : le catalogue les bascule
 * lui-même par ses filtres. `match` sert à garder l'entrée active sur les deux
 * types, puisque le lien ne pointe que sur l'un des deux.
 */
const NAV_LINKS = [
  { href: "/", key: "nav.home", match: "/" },
  { href: "/catalog", key: "nav.catalog", match: "/catalog" },
  { href: "/new", key: "nav.new", match: "/new" },
  { href: "/search", key: "nav.search", match: "/search" },
] as const satisfies readonly {
  href: string;
  key: MessageKey;
  match: string;
}[];

export function Navbar({ session }: { session: React.ReactNode }) {
  const t = useTranslations();

  return (
    <header className="chrome sticky top-0 z-50 border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="press shrink-0 rounded-full text-lg font-bold tracking-tighter text-foreground-strong outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          JUST<span className="text-foreground-muted">.</span>
        </Link>

        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <CommandMenu />
          {/*
            Entre `md` et `lg` le rail de liens est visible mais le champ de
            recherche (`max-lg:hidden`) ne l'est pas : ce raccourci comble ce
            seul intervalle. Sous `md`, la recherche est dans le burger.
          */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full max-md:hidden lg:hidden"
                  render={<Link href="/search" aria-label={t("nav.searchLabel")} />}
                >
                  <Search size={18} />
                </Button>
              }
            />
            <TooltipContent>{t("nav.searchLabel")}</TooltipContent>
          </Tooltip>
          <ThemeToggle />
          {session}
          <Suspense fallback={<BurgerMenu pathname={null} />}>
            <ActiveBurgerMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

function ActiveNavLinks() {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} />;
}

function ActiveBurgerMenu() {
  const pathname = usePathname();
  return <BurgerMenu pathname={pathname} />;
}

/**
 * Sous `md`, les quatre entrées ne tiennent plus à côté du logo et du bloc de
 * compte : le rail devenait une bande à faire défiler, où les dernières entrées
 * n'étaient plus visibles. Le burger les remet toutes à portée.
 */
function BurgerMenu({ pathname }: { pathname: string | null }) {
  const t = useTranslations();

  return (
    <DropdownMenu size="sm">
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full md:hidden"
            aria-label={t("nav.menu")}
          >
            <Menu2 size={20} />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        {NAV_LINKS.map((link) => {
          const active = isActive(link.match, pathname);
          return (
            <DropdownMenuItem
              key={link.href}
              render={
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                />
              }
              className={active ? "text-foreground-strong" : undefined}
            >
              {t(link.key)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function isActive(match: string, pathname: string | null): boolean {
  if (pathname === null) return false;
  return match === "/" ? pathname === "/" : pathname.startsWith(match);
}

function NavLinks({ pathname }: { pathname: string | null }) {
  const t = useTranslations();

  return (
    <nav
      aria-label={t("nav.label")}
      className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto max-md:hidden"
    >
      {NAV_LINKS.map((link) => {
        const active = isActive(link.match, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5 ${
              active
                ? "bg-background-muted text-foreground-strong"
                : "text-foreground-muted hover:text-foreground-strong"
            }`}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
