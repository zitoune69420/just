"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@appica/ui-react/button";
import { Field, FieldLabel } from "@appica/ui-react/field";
import { Input } from "@appica/ui-react/input";
import { Spinner } from "@appica/ui-react/spinner";
import { AlertCircle } from "@appica/icons-react";
import { resetPassword, type ResetState } from "@/lib/reset-actions";

const INITIAL: ResetState = { error: null };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <Field className="gap-1.5">
        <FieldLabel htmlFor="reset-password">Nouveau mot de passe</FieldLabel>
        <Input
          id="reset-password"
          name="password"
          type="password"
          required
          autoFocus
          minLength={8}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="reset-confirm">Confirmation</FieldLabel>
        <Input
          id="reset-confirm"
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

      <Button
        type="submit"
        className="press w-full rounded-full"
        disabled={pending}
      >
        {pending ? <Spinner className="text-base" /> : null}
        {pending ? "Un instant…" : "Changer le mot de passe"}
      </Button>

      <p className="text-center text-sm text-foreground-muted">
        <Link
          href="/forgot-password"
          className="rounded-full underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Demander un nouveau lien
        </Link>
      </p>
    </form>
  );
}
