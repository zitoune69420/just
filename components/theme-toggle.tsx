"use client";

import { Button } from "@appica/ui-react/button";
import { useTheme } from "@appica/ui-react/hooks/use-theme";
import { Tooltip, TooltipContent, TooltipTrigger } from "@appica/ui-react/tooltip";
import { Moon, Sun } from "@appica/icons-react";
import { useTranslations } from "./i18n-provider";

const ICON_BASE =
  "col-start-1 row-start-1 transition-[opacity,rotate,scale] duration-200 ease-out motion-reduce:transition-none";
// Visibility driven by the `.dark` class on <html> so the right icon is painted
// before hydration instead of both icons sitting at opacity-0.
const ICON_LIGHT_ONLY =
  "scale-100 rotate-0 opacity-100 dark:scale-75 dark:rotate-90 dark:opacity-0";
const ICON_DARK_ONLY =
  "scale-75 rotate-90 opacity-0 dark:scale-100 dark:rotate-0 dark:opacity-100";

export function ThemeToggle() {
  const t = useTranslations();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const label = t("theme.toggle");

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label={label}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            <span className="grid place-items-center">
              <Sun size={18} className={`${ICON_BASE} ${ICON_DARK_ONLY}`} />
              <Moon size={18} className={`${ICON_BASE} ${ICON_LIGHT_ONLY}`} />
            </span>
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
