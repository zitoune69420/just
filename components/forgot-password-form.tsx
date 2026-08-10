"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@appica/ui-react/button";
import { Field, FieldLabel } from "@appica/ui-react/field";
import { Input } from "@appica/ui-react/input";
import { Spinner } from "@appica/ui-react/spinner";
import { AlertCircle, Mail } from "@appica/icons-react";
import {
  requestPasswordReset,
  type ResetRequestState,
} from "@/lib/reset-actions";

const INITIAL: ResetRequestState = { error: null, sent: false };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    INITIAL,
  );

  if (state.sent) {
    return (
      <div className="space-y-4">
        <p
          role="status"
          className="flex items-start gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
        >
          <Mail size={20} className="mt-0.5 shrink-0" />
          Si un compte existe avec cette adresse, un lien de réinitialisation
          vient d’être envoyé. Il est valable une heure.
        </p>
        <Button
          variant="outline"
          className="w-full rounded-full"
          render={<Link href="/login" />}
        >
          Retour à la connexion
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="forgot-email">Adresse e-mail</FieldLabel>
        <Input
          id="forgot-email"
          name="email"
          type="email"
          required
          autoFocus
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="vous@exemple.com"
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
        {pending ? "Envoi…" : "Envoyer le lien"}
      </Button>

      <p className="text-center text-sm text-foreground-muted">
        <Link
          href="/login"
          className="rounded-full underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}
