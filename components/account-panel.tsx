import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@appica/ui-react/avatar";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { AlertCircle, Check } from "@appica/icons-react";
import { isDiscordConfigured } from "@/lib/discord";
import { countGrants, currentPeriod } from "@/lib/grants";
import { getTranslator } from "@/lib/i18n/server";
import type { MessageKey, Translate } from "@/lib/i18n/translate";
import {
  FREE_MOVIE_LIMIT,
  FREE_SERIES_LIMIT,
  GOLD_MOVIES_PER_MONTH,
  roleLabelKey,
  roleSummaryKey,
  type Role,
} from "@/lib/roles";
import { getSession } from "@/lib/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { findUserById } from "@/lib/users";
import { DiscordMark, DiscordSignInButton } from "./discord-sign-in";
import { LocaleCard } from "./locale-card";
import { PasswordForm } from "./password-form";
import { SearchHistoryCard } from "./search-history-card";

const ERRORS: Record<string, MessageKey> = {
  linked: "account.error.linked",
  database: "account.error.database",
  denied: "account.error.denied",
  state: "account.error.state",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-border/60 bg-background-subtle/60 p-6 sm:p-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-foreground-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

async function quotaUsage(userId: string, role: Role) {
  if (role !== "user" && role !== "gold") return { movies: 0, series: 0 };
  try {
    const [movies, series] = await Promise.all([
      countGrants(userId, "movie", role === "gold" ? currentPeriod() : undefined),
      countGrants(userId, "tv"),
    ]);
    return { movies, series };
  } catch {
    return { movies: 0, series: 0 };
  }
}

function LanguageSection({ t }: { t: Translate }) {
  return (
    <Section title={t("account.language")} description={t("account.languageHint")}>
      <LocaleCard />
    </Section>
  );
}

export async function AccountPanel({ error }: { error?: string }) {
  const t = await getTranslator();
  const session = await getSession();

  if (!session) {
    return (
      <div className="space-y-6">
        <Section
          title={t("account.signInRequired")}
          description={t("account.signInHint")}
        >
          <Button className="rounded-full" render={<Link href="/login" />}>
            {t("account.signIn")}
          </Button>
        </Section>
        <LanguageSection t={t} />
      </div>
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <div className="space-y-6">
        <Section
          title={t("account.noDatabase")}
          description={t("account.noDatabaseHint")}
        >
          <Badge variant="soft" className="rounded-full">
            {t("auth.configRequired")}
          </Badge>
        </Section>
        <LanguageSection t={t} />
      </div>
    );
  }

  const user = await findUserById(session.id);

  if (!user) {
    return (
      <div className="space-y-6">
        <Section
          title={t("account.notFound")}
          description={t("account.notFoundHint")}
        >
          <Button className="rounded-full" render={<Link href="/login" />}>
            {t("account.signInAgain")}
          </Button>
        </Section>
        <LanguageSection t={t} />
      </div>
    );
  }

  const message = error ? t(ERRORS[error] ?? "account.error.database") : null;
  const usage = await quotaUsage(user.id, user.role);

  return (
    <div className="space-y-6">
      {message && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
        >
          <AlertCircle size={20} className="shrink-0" />
          {message}
        </p>
      )}

      <div className="flex items-center gap-4 rounded-3xl border border-border/60 bg-background-subtle/60 p-6 sm:p-8">
        <Avatar size="lg" shape="circle">
          {user.avatar && <AvatarImage src={user.avatar} alt="" />}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight">
            {user.name}
          </p>
          <p className="truncate text-sm text-foreground-muted">
            {user.email ?? t("account.noEmail")}
          </p>
        </div>
      </div>

      <Section
        title={t("account.plan")}
        description={t(roleSummaryKey(user.role))}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="soft" className="rounded-full">
            {t(roleLabelKey(user.role))}
          </Badge>
          {user.role === "user" && (
            <span className="text-sm text-foreground-muted">
              {t("account.usageFree", {
                movies: usage.movies,
                limit: FREE_MOVIE_LIMIT,
                series: usage.series,
                seriesLimit: FREE_SERIES_LIMIT,
              })}
            </span>
          )}
          {user.role === "gold" && (
            <span className="text-sm text-foreground-muted">
              {t("account.usageGold", {
                movies: usage.movies,
                limit: GOLD_MOVIES_PER_MONTH,
              })}
            </span>
          )}
        </div>
      </Section>

      <LanguageSection t={t} />

      <Section
        title={
          user.password_hash ? t("account.password") : t("account.addPassword")
        }
        description={
          user.password_hash
            ? t("account.passwordHint")
            : t("account.addPasswordHint")
        }
      >
        <PasswordForm
          hasPassword={Boolean(user.password_hash)}
          hasEmail={Boolean(user.email)}
        />
      </Section>

      <Section
        title={t("account.discord")}
        description={
          user.discord_id
            ? t("account.discordLinked")
            : t("account.discordLink")
        }
      >
        {user.discord_id ? (
          <p className="flex items-center gap-2 text-sm text-foreground-muted">
            <Check size={18} className="shrink-0 text-success" />
            <DiscordMark size={16} className="shrink-0 text-[#5865F2]" />
            {t("account.discordLinkedShort")}
          </p>
        ) : isDiscordConfigured() ? (
          <DiscordSignInButton
            label={t("auth.discordLink")}
            returnTo="/account"
          />
        ) : (
          <p className="text-sm text-foreground-muted">
            {t("account.discordUnavailable")}
          </p>
        )}
      </Section>

      <Section
        title={t("account.searchHistory")}
        description={t("account.searchHistoryHint")}
      >
        <SearchHistoryCard />
      </Section>
    </div>
  );
}
