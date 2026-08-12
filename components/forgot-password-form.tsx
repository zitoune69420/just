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
import { useTranslations } from "./i18n-provider";

const INITIAL: ResetRequestState = { error: null, sent: false };

export function ForgotPasswordForm() {
  const t = useTranslations();
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
          {t("reset.sent")}
        </p>
        <Button
          variant="outline"
          className="w-full rounded-full"
          render={<Link href="/login" />}
        >
          {t("reset.backToSignIn")}
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="forgot-email">{t("auth.email")}</FieldLabel>
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
          placeholder={t("form.emailPlaceholder")}
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
        {pending ? t("reset.requestPending") : t("reset.requestSubmit")}
      </Button>

      <p className="text-center text-sm text-foreground-muted">
        <Link
          href="/login"
          className="rounded-full underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("reset.backToSignIn")}
        </Link>
      </p>
    </form>
  );
}
