"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@appica/ui-react/button";
import { Input } from "@appica/ui-react/input";
import { Search } from "@appica/icons-react";
import { ThemeToggle } from "./theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/movies", label: "Films" },
  { href: "/series", label: "Séries" },
] as const;

export function Navbar() {
  const router = useRouter();

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get("q");
    if (typeof query === "string" && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="chrome sticky top-0 z-50 border-b border-border/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="press rounded-full text-lg font-bold tracking-tighter text-foreground-strong outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          JUST<span className="text-foreground-muted">.</span>
        </Link>

        {/* usePathname est une donnée runtime : hors Suspense, il bloquerait
            le shell statique des routes dynamiques (Cache Components). */}
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>

        <div className="ms-auto flex items-center gap-2">
          <form onSubmit={handleSearch} role="search" className="max-sm:hidden">
            <Input
              name="q"
              inputSize="sm"
              placeholder="Rechercher…"
              aria-label="Rechercher un film ou une série"
              startSlot={<Search size={16} />}
              className="w-52 rounded-full"
            />
          </form>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full sm:hidden"
            render={<Link href="/search" aria-label="Recherche" />}
          >
            <Search size={18} />
          </Button>
          <ThemeToggle />
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
    <nav aria-label="Navigation principale" className="flex items-center gap-1">
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
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5 ${
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
