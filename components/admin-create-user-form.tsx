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
import { ROLE_LABELS, ROLES, type Role } from "@/lib/roles";

const INITIAL: AdminUserState = { error: null, success: null };

export function AdminCreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="new-name">Pseudo</FieldLabel>
        <Input
          id="new-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={40}
          autoComplete="off"
          placeholder="Pseudo affiché"
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="new-email">Adresse e-mail</FieldLabel>
        <Input
          id="new-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="vous@exemple.com"
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="new-password">Mot de passe</FieldLabel>
        <Input
          id="new-password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="new-role">Offre</FieldLabel>
        <Select name="role" defaultValue={"user" satisfies Role}>
          <SelectTrigger id="new-role" className="w-full">
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

      <Button type="submit" className="press rounded-full" disabled={pending}>
        {pending ? <Spinner className="text-base" /> : null}
        {pending ? "Création…" : "Créer le compte"}
      </Button>
    </form>
  );
}
