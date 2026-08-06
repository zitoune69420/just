"use client";

import { useActionState, useState } from "react";
import { Button } from "@appica/ui-react/button";
import { Field, FieldLabel } from "@appica/ui-react/field";
import { Input } from "@appica/ui-react/input";
import { Spinner } from "@appica/ui-react/spinner";
import { AlertCircle } from "@appica/icons-react";
import { authenticate, type CredentialsState } from "@/lib/auth-actions";

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
              <FieldLabel htmlFor="credentials-name">Pseudo</FieldLabel>
              <Input
                id="credentials-name"
                name="name"
                type="text"
                required={signup}
                disabled={!signup}
                minLength={2}
                maxLength={40}
                autoComplete="nickname"
                placeholder="Votre pseudo"
              />
            </Field>
          </div>
        </Collapse>

        <div className="pb-4">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="credentials-email">Adresse e-mail</FieldLabel>
            <Input
              id="credentials-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="vous@exemple.com"
            />
          </Field>
        </div>

        <div className="pb-4">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="credentials-password">
              Mot de passe
            </FieldLabel>
            <Input
              id="credentials-password"
              name="password"
              type="password"
              required
              minLength={signup ? 8 : undefined}
              autoComplete={signup ? "new-password" : "current-password"}
              placeholder={signup ? "8 caractères minimum" : "••••••••"}
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
            <Layer visible={!pending && !signup}>Se connecter</Layer>
            <Layer visible={!pending && signup}>Créer mon compte</Layer>
            <Layer visible={pending}>
              <Spinner className="text-base" />
              Un instant…
            </Layer>
          </span>
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted">
        <span className="grid">
          <Layer visible={!signup}>
            Pas encore de compte ?{" "}
            <ModeSwitch onClick={() => setMode("signup")}>
              Créer un compte
            </ModeSwitch>
          </Layer>
          <Layer visible={signup}>
            Déjà un compte ?{" "}
            <ModeSwitch onClick={() => setMode("signin")}>
              Se connecter
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
