"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@appica/ui-react/button";
import { Field, FieldLabel } from "@appica/ui-react/field";
import { Input } from "@appica/ui-react/input";
import { Spinner } from "@appica/ui-react/spinner";
import { AlertCircle } from "@appica/icons-react";
import { resetPassword, type ResetState } from "@/lib/reset-actions";
import { useTranslations } from "./i18n-provider";

const INITIAL: ResetState = { error: null };

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(resetPassword, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <Field className="gap-1.5">
        <FieldLabel htmlFor="reset-password">{t("reset.newPassword")}</FieldLabel>
        <Input
          id="reset-password"
          name="password"
          type="password"
          required
          autoFocus
          minLength={8}
          autoComplete="new-password"
          placeholder={t("form.passwordPlaceholder")}
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="reset-confirm">{t("reset.confirm")}</FieldLabel>
        <Input
          id="reset-confirm"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder={t("form.confirmPlaceholder")}
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
        {pending ? t("reset.pending") : t("reset.submit")}
      </Button>

      <p className="text-center text-sm text-foreground-muted">
        <Link
          href="/forgot-password"
          className="rounded-full underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("reset.askNewLink")}
        </Link>
      </p>
    </form>
  );
}
