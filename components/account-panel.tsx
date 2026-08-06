import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@appica/ui-react/avatar";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { AlertCircle, Check } from "@appica/icons-react";
import { isDiscordConfigured } from "@/lib/discord";
import { getSession } from "@/lib/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase";
import { findUserById } from "@/lib/users";
import { DiscordMark, DiscordSignInButton } from "./discord-sign-in";
import { PasswordForm } from "./password-form";

const ERRORS: Record<string, string> = {
  linked: "Ce compte Discord est déjà rattaché à un autre compte JUST.",
  database: "Base de données injoignable. Réessayez plus tard.",
  denied: "Liaison annulée sur Discord.",
  state: "Lien de liaison expiré ou invalide. Relancez l’opération.",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-border/60 bg-background-subtle/60 p-6 sm:p-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-foreground-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}

export async function AccountPanel({ error }: { error?: string }) {
  const session = await getSession();

  if (!session) {
    return (
      <Section
        title="Connexion requise"
        description="Connectez-vous pour gérer votre compte."
      >
        <Button className="rounded-full" render={<Link href="/login" />}>
          Se connecter
        </Button>
      </Section>
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return (
      <Section
        title="Base de données non configurée"
        description="Les réglages de compte ont besoin des variables Supabase dans .env.local."
      >
        <Badge variant="soft" className="rounded-full">
          Configuration requise
        </Badge>
      </Section>
    );
  }

  const user = await findUserById(session.id);

  if (!user) {
    return (
      <Section
        title="Compte introuvable"
        description="Votre session ne correspond à aucun compte. Déconnectez-vous puis reconnectez-vous."
      >
        <Button className="rounded-full" render={<Link href="/login" />}>
          Se reconnecter
        </Button>
      </Section>
    );
  }

  const message = error ? (ERRORS[error] ?? ERRORS.database) : null;

  return (
    <div className="space-y-6">
      {message && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
        >
          <AlertCircle size={20} className="shrink-0" />
          {message}
        </p>
      )}

      <div className="flex items-center gap-4 rounded-3xl border border-border/60 bg-background-subtle/60 p-6 sm:p-8">
        <Avatar size="lg" shape="circle">
          {user.avatar && <AvatarImage src={user.avatar} alt="" />}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold tracking-tight">
            {user.name}
          </p>
          <p className="truncate text-sm text-foreground-muted">
            {user.email ?? "Aucune adresse e-mail"}
          </p>
        </div>
      </div>

      <Section
        title={
          user.password_hash ? "Mot de passe" : "Ajouter un mot de passe"
        }
        description={
          user.password_hash
            ? "Changez le mot de passe utilisé pour la connexion par e-mail."
            : "Définissez un mot de passe pour vous connecter sans passer par Discord."
        }
      >
        <PasswordForm
          hasPassword={Boolean(user.password_hash)}
          hasEmail={Boolean(user.email)}
        />
      </Section>

      <Section
        title="Discord"
        description={
          user.discord_id
            ? "Votre compte Discord est rattaché."
            : "Rattachez Discord pour vous connecter en un clic."
        }
      >
        {user.discord_id ? (
          <p className="flex items-center gap-2 text-sm text-foreground-muted">
            <Check size={18} className="shrink-0 text-success" />
            <DiscordMark size={16} className="shrink-0 text-[#5865F2]" />
            Compte lié
          </p>
        ) : isDiscordConfigured() ? (
          <DiscordSignInButton
            label="Lier mon compte Discord"
            returnTo="/account"
          />
        ) : (
          <p className="text-sm text-foreground-muted">
            Connexion Discord non configurée sur ce serveur.
          </p>
        )}
      </Section>
    </div>
  );
}
