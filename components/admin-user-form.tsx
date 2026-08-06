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
import { AlertCircle, Check } from "@appica/icons-react";
import { saveUser, type AdminUserState } from "@/lib/admin-actions";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/roles";

const INITIAL: AdminUserState = { error: null, success: null };

export function AdminUserForm({
  id,
  name,
  email,
  role,
}: {
  id: string;
  name: string;
  email: string | null;
  role: Role;
}) {
  const [state, formAction, pending] = useActionState(saveUser, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={id} />

      <Field className="gap-1.5">
        <FieldLabel htmlFor="admin-name">Pseudo</FieldLabel>
        <Input
          id="admin-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={40}
          defaultValue={name}
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="admin-email">Adresse e-mail</FieldLabel>
        <Input
          id="admin-email"
          name="email"
          type="email"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={email ?? ""}
          placeholder="Aucune adresse"
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="admin-password">Nouveau mot de passe</FieldLabel>
        <Input
          id="admin-password"
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          placeholder="Laisser vide pour ne pas changer"
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="admin-role">Offre</FieldLabel>
        <Select name="role" defaultValue={role}>
          <SelectTrigger id="admin-role" className="w-full">
            <SelectValue>
              {(value: Role) => ROLE_LABELS[value] ?? value}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((item) => (
              <SelectItem key={item} value={item}>
                {ROLE_LABELS[item]}
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
        {pending ? <Spinner className="text-base" /> : null}
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
