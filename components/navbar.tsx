"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@appica/ui-react/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@appica/ui-react/tooltip";
import { Search } from "@appica/icons-react";
import { CommandMenu } from "./command-menu";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/movies", label: "Films" },
  { href: "/series", label: "Séries" },
  { href: "/search", label: "Search" },
] as const;

export function Navbar({ session }: { session: React.ReactNode }) {
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
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full lg:hidden"
                  render={<Link href="/search" aria-label="Recherche" />}
                >
                  <Search size={18} />
                </Button>
              }
            />
            <TooltipContent>Recherche</TooltipContent>
          </Tooltip>
          <ThemeToggle />
          {session}
        </div>
      </div>
    </header>
  );
}

function ActiveNavLinks() {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto"
    >
      {NAV_LINKS.map((link) => {
        const active =
          pathname !== null &&
          (link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href));
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
