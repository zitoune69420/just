"use client";

import { useActionState, useState } from "react";
import { Button } from "@appica/ui-react/button";
import { Field, FieldLabel } from "@appica/ui-react/field";
import { Input } from "@appica/ui-react/input";
import { Spinner } from "@appica/ui-react/spinner";
import { AlertCircle } from "@appica/icons-react";
import { authenticate, type CredentialsState } from "@/lib/auth-actions";
import { useTranslations } from "./i18n-provider";

type Mode = "signin" | "signup";

const INITIAL: CredentialsState = { error: null };

function Collapse({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div
        inert={!open}
        className={`overflow-hidden transition-opacity duration-200 ease-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Layer({
  visible,
  children,
  className = "",
}: {
  visible: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden={!visible}
      inert={!visible}
      className={`col-start-1 row-start-1 flex items-center justify-center gap-2 transition-[opacity,translate] duration-200 ease-out motion-reduce:translate-y-0 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function CredentialsForm({
  returnTo,
  initialMode = "signin",
}: {
  returnTo?: string;
  initialMode?: Mode;
}) {
  const t = useTranslations();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [state, formAction, pending] = useActionState(authenticate, INITIAL);
  const [shownError, setShownError] = useState<string | null>(null);

  if (state.error && state.error !== shownError) setShownError(state.error);

  const signup = mode === "signup";

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-col">
        <input type="hidden" name="mode" value={mode} />
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        <Collapse open={signup}>
          <div className="pb-4">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="credentials-name">{t("auth.name")}</FieldLabel>
              <Input
                id="credentials-name"
                name="name"
                type="text"
                required={signup}
                disabled={!signup}
                minLength={2}
                maxLength={40}
                autoComplete="nickname"
                placeholder={t("auth.namePlaceholder")}
              />
            </Field>
          </div>
        </Collapse>

        <div className="pb-4">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="credentials-email">{t("auth.email")}</FieldLabel>
            <Input
              id="credentials-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t("form.emailPlaceholder")}
            />
          </Field>
        </div>

        <div className="pb-4">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="credentials-password">
              {t("auth.password")}
            </FieldLabel>
            <Input
              id="credentials-password"
              name="password"
              type="password"
              required
              minLength={signup ? 8 : undefined}
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder={signup ? t("form.passwordPlaceholder") : "••••••••"}
            />
          </Field>
        </div>

        <Collapse open={Boolean(state.error)}>
          <div className="pb-4">
            <p
              role="alert"
              className="flex items-center gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
            >
              <AlertCircle size={20} className="shrink-0" />
              {shownError}
            </p>
          </div>
        </Collapse>

        <Button
          type="submit"
          size="lg"
          className="press w-full rounded-full"
          disabled={pending}
        >
          <span className="grid">
            <Layer visible={!pending && !signup}>{t("auth.submitSignIn")}</Layer>
            <Layer visible={!pending && signup}>{t("auth.submitSignUp")}</Layer>
            <Layer visible={pending}>
              <Spinner className="text-base" />
              {t("auth.pending")}
            </Layer>
          </span>
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted">
        <span className="grid">
          <Layer visible={!signup}>
            {t("auth.noAccount")}{" "}
            <ModeSwitch onClick={() => setMode("signup")}>
              {t("auth.createAccount")}
            </ModeSwitch>
          </Layer>
          <Layer visible={signup}>
            {t("auth.haveAccount")}{" "}
            <ModeSwitch onClick={() => setMode("signin")}>
              {t("auth.submitSignIn")}
            </ModeSwitch>
          </Layer>
        </span>
      </p>
    </div>
  );
}

function ModeSwitch({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press rounded-full font-medium text-foreground-strong underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}
