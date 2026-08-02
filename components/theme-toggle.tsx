"use client";

import { Button } from "@appica/ui-react/button";
import { useTheme } from "@appica/ui-react/hooks/use-theme";
import { Moon, Sun } from "@appica/icons-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme, mounted } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="rounded-full"
      aria-label={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {/* Icône masquée avant le montage pour éviter un flash du mauvais thème. */}
      {mounted ? (
        isDark ? (
          <Sun size={18} />
        ) : (
          <Moon size={18} />
        )
      ) : (
        <Moon size={18} className="opacity-0" />
      )}
    </Button>
  );
}
