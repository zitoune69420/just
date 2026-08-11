import Link from "next/link";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { Separator } from "@appica/ui-react/separator";
import { AlertCircle, Check } from "@appica/icons-react";
import { isDiscordConfigured } from "@/lib/discord";
import { getTranslator } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/translate";
import { getSession } from "@/lib/auth";
import { hasSessionSecret } from "@/lib/session";
import { CredentialsForm } from "./credentials-form";
import { DiscordSignInButton } from "./discord-sign-in";

const ERRORS: Record<string, MessageKey> = {
  denied: "auth.error.denied",
  state: "auth.error.state",
  discord: "auth.error.discord",
  config: "auth.error.config",
  database: "auth.error.database",
};

function safeReturnTo(value: string | undefined): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="enter mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="space-y-6 rounded-3xl border border-border/60 bg-background-subtle/60 p-8 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

export function SignInPanelSkeleton() {
  return (
    <Shell>
      <div className="h-7 w-40 animate-pulse rounded-full bg-background-muted" />
      <div className="h-4 w-full animate-pulse rounded-full bg-background-muted" />
      <div className="h-11 w-full animate-pulse rounded-full bg-background-muted" />
    </Shell>
  );
}

async function NotConfigured() {
  const t = await getTranslator();

  return (
    <Shell>
      <Badge variant="soft" className="rounded-full">
        {t("auth.configRequired")}
      </Badge>
      <h1 className="text-2xl font-bold tracking-tight">
        {t("auth.notConfigured")}
      </h1>
      <ol className="list-decimal space-y-2 ps-5 text-sm text-foreground-muted">
        <li>
          {t("auth.notConfiguredIntro")}{" "}
          <code>openssl rand -base64 32</code>
        </li>
        <li>{t("auth.notConfiguredEnv")}</li>
      </ol>
      <pre className="overflow-x-auto rounded-2xl bg-background-muted p-4 text-sm">
        <code>
          {
            "AUTH_SECRET=…\nDISCORD_CLIENT_ID=…\nDISCORD_CLIENT_SECRET=…"
          }
        </code>
      </pre>
      <p className="text-sm text-foreground-muted">
        {t("auth.notConfiguredRestart")}{" "}
        <code className="rounded-md bg-background-muted px-1.5 py-0.5">
          npm run dev
        </code>
        .
      </p>
    </Shell>
  );
}

export async function SignInPanel({
  error,
  returnTo,
  mode,
  reset,
}: {
  error?: string;
  returnTo?: string;
  mode?: string;
  reset?: string;
}) {
  const t = await getTranslator();

  if (!hasSessionSecret()) return <NotConfigured />;

  const user = await getSession();
  const destination = safeReturnTo(returnTo);
  const message = error ? t(ERRORS[error] ?? "auth.error.discord") : null;

  if (user) {
    return (
      <Shell>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("auth.signedIn")}
          </h1>
          <p className="flex items-center gap-2 text-sm text-foreground-muted">
            <Check size={18} className="shrink-0" />
            {t("auth.signedInAs")}{" "}
            <span className="font-medium text-foreground-strong">
              {user.name}
            </span>
          </p>
        </div>
        <Button className="w-full rounded-full" render={<Link href={destination ?? "/"} />}>
          {t("auth.continue")}
        </Button>
      </Shell>
    );
  }

  return (
    <div className='max-w-sm space-y-4 flex flex-col mx-auto h-140 my-auto'>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("auth.title")}
        </h1>
        <p className="text-sm text-foreground-muted">{t("auth.subtitle")}</p>
      </div>

      {message && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
        >
          <AlertCircle size={20} className="shrink-0" />
          {message}
        </p>
      )}

      {reset === "done" && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
        >
          <Check size={20} className="shrink-0 text-success" />
          {t("auth.passwordChanged")}
        </p>
      )}

      <CredentialsForm
        returnTo={destination}
        initialMode={mode === "signup" ? "signup" : "signin"}
      />

      <p className="text-center text-sm text-foreground-muted">
        <Link
          href="/forgot-password"
          className="rounded-full underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("auth.forgotPassword")}
        </Link>
      </p>

      {isDiscordConfigured() && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-foreground-subtle">
              {t("auth.or")}
            </span>
            <Separator className="flex-1" />
          </div>

          <DiscordSignInButton
            size="lg"
            returnTo={destination}
            className="w-full"
          />
        </>
      )}
    </div>
  );
}
