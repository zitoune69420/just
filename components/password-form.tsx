"use client";

import { useActionState } from "react";
import { Button } from "@appica/ui-react/button";
import { Field, FieldLabel } from "@appica/ui-react/field";
import { Input } from "@appica/ui-react/input";
import { Spinner } from "@appica/ui-react/spinner";
import { AlertCircle, Check } from "@appica/icons-react";
import { savePassword, type AccountState } from "@/lib/account-actions";

const INITIAL: AccountState = { error: null, success: null };

export function PasswordForm({
  hasPassword,
  hasEmail,
}: {
  hasPassword: boolean;
  hasEmail: boolean;
}) {
  const [state, formAction, pending] = useActionState(savePassword, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      {!hasEmail && (
        <Field className="gap-1.5">
          <FieldLabel htmlFor="account-email">Adresse e-mail</FieldLabel>
          <Input
            id="account-email"
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
      )}

      {hasPassword && (
        <Field className="gap-1.5">
          <FieldLabel htmlFor="account-current">
            Mot de passe actuel
          </FieldLabel>
          <Input
            id="account-current"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Field>
      )}

      <Field className="gap-1.5">
        <FieldLabel htmlFor="account-password">
          {hasPassword ? "Nouveau mot de passe" : "Mot de passe"}
        </FieldLabel>
        <Input
          id="account-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="account-confirm">Confirmation</FieldLabel>
        <Input
          id="account-confirm"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Retapez le mot de passe"
        />
      </Field>

      {state.error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
        >
          <AlertCircle size={20} className="shrink-0" />
          {state.error}
        </p>
      )}

      {state.success && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
        >
          <Check size={20} className="shrink-0 text-success" />
          {state.success}
        </p>
      )}

      <Button
        type="submit"
        className="press rounded-full"
        disabled={pending}
      >
        <span className="grid">
          <span
            aria-hidden={pending}
            inert={pending}
            className={`col-start-1 row-start-1 flex items-center justify-center gap-2 transition-[opacity,translate] duration-200 ease-out ${
              pending ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
            }`}
          >
            {hasPassword ? "Changer le mot de passe" : "Définir le mot de passe"}
          </span>
          <span
            aria-hidden={!pending}
            inert={!pending}
            className={`col-start-1 row-start-1 flex items-center justify-center gap-2 transition-[opacity,translate] duration-200 ease-out ${
              pending ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            }`}
          >
            <Spinner className="text-base" />
            Un instant…
          </span>
        </span>
      </Button>
    </form>
  );
}
