"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@appica/ui-react/button";
import { Input } from "@appica/ui-react/input";
import { AlertCircle, Lock, Mail, User } from "@appica/icons-react";

type AuthMode = "login" | "register";

const COPY = {
  login: {
    title: "Connexion",
    subtitle: "Retrouvez votre liste et vos recommandations.",
    submit: "Se connecter",
    switchText: "Pas encore de compte ?",
    switchLabel: "Créer un compte",
    switchHref: "/register",
  },
  register: {
    title: "Créer un compte",
    subtitle: "Gardez sous la main les films et séries qui vous intéressent.",
    submit: "Créer mon compte",
    switchText: "Vous avez déjà un compte ?",
    switchLabel: "Se connecter",
    switchHref: "/login",
  },
} as const;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const copy = COPY[mode];
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="enter mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="space-y-6 rounded-3xl border border-border/60 bg-background-subtle/60 p-8 backdrop-blur-sm">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-foreground-muted">{copy.subtitle}</p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          {mode === "register" && (
            <AuthField id="name" label="Nom">
              <Input
                id="name"
                name="name"
                autoComplete="name"
                placeholder="Votre nom"
                startSlot={<User size={18} />}
                className="rounded-2xl"
              />
            </AuthField>
          )}

          <AuthField id="email" label="Adresse e-mail">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="vous@exemple.com"
              startSlot={<Mail size={18} />}
              className="rounded-2xl"
            />
          </AuthField>

          <AuthField id="password" label="Mot de passe">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              placeholder="••••••••"
              startSlot={<Lock size={18} />}
              className="rounded-2xl"
            />
          </AuthField>

          {submitted && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
            >
              <AlertCircle size={20} className="mt-px shrink-0" />
              L’authentification n’est pas encore branchée : le formulaire ne
              crée pas de session pour le moment.
            </p>
          )}

          <Button type="submit" className="w-full rounded-full">
            {copy.submit}
          </Button>
        </form>

        <p className="text-center text-sm text-foreground-muted">
          {copy.switchText}{" "}
          <Link
            href={copy.switchHref}
            className="rounded-sm font-medium text-foreground-strong underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {copy.switchLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}

function AuthField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground-strong"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
