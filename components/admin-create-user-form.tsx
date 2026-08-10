"use client";

import { useActionState } from "react";
import { Button } from "@appica/ui-react/button";
import { Field, FieldLabel } from "@appica/ui-react/field";
import { Input } from "@appica/ui-react/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@appica/ui-react/select";
import { Spinner } from "@appica/ui-react/spinner";
import { AlertCircle } from "@appica/icons-react";
import { createUser, type AdminUserState } from "@/lib/admin-actions";
import { roleLabelKey, ROLES, type Role } from "@/lib/roles";
import { useTranslations } from "./i18n-provider";

const INITIAL: AdminUserState = { error: null, success: null };

export function AdminCreateUserForm() {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(createUser, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="new-name">{t("admin.name")}</FieldLabel>
        <Input
          id="new-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={40}
          autoComplete="off"
          placeholder={t("admin.namePlaceholder")}
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="new-email">{t("admin.email")}</FieldLabel>
        <Input
          id="new-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t("form.emailPlaceholder")}
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="new-password">{t("auth.password")}</FieldLabel>
        <Input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder={t("form.passwordPlaceholder")}
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="new-role">{t("admin.role")}</FieldLabel>
        <Select name="role" defaultValue={"user" satisfies Role}>
          <SelectTrigger id="new-role" className="w-full">
            <SelectValue>
              {(value: Role) => t(roleLabelKey(value))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((item) => (
              <SelectItem key={item} value={item}>
                {t(roleLabelKey(item))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <Button type="submit" className="press rounded-full" disabled={pending}>
        {pending ? <Spinner className="text-base" /> : null}
        {pending ? t("admin.creating") : t("admin.create")}
      </Button>
    </form>
  );
}
