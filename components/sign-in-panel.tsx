import Link from "next/link";
import { Badge } from "@appica/ui-react/badge";
import { Button } from "@appica/ui-react/button";
import { Separator } from "@appica/ui-react/separator";
import { AlertCircle, Check } from "@appica/icons-react";
import { isDiscordConfigured } from "@/lib/discord";
import { getSession, hasSessionSecret } from "@/lib/session";
import { CredentialsForm } from "./credentials-form";
import { DiscordSignInButton } from "./discord-sign-in";

const ERRORS: Record<string, string> = {
  denied: "Connexion annulée sur Discord.",
  state: "Lien de connexion expiré ou invalide. Relancez la connexion.",
  discord: "Discord n’a pas pu confirmer votre identité. Réessayez.",
  config: "La connexion Discord n’est pas configurée sur ce serveur.",
  database:
    "Compte impossible à enregistrer : base de données injoignable ou schéma manquant.",
};

function safeReturnTo(value: string | undefined): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="enter mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="space-y-6 rounded-3xl border border-border/60 bg-background-subtle/60 p-8 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}

export function SignInPanelSkeleton() {
  return (
    <Shell>
      <div className="h-7 w-40 animate-pulse rounded-full bg-background-muted" />
      <div className="h-4 w-full animate-pulse rounded-full bg-background-muted" />
      <div className="h-11 w-full animate-pulse rounded-full bg-background-muted" />
    </Shell>
  );
}

function NotConfigured() {
  return (
    <Shell>
      <Badge variant="soft" className="rounded-full">
        Configuration requise
      </Badge>
      <h1 className="text-2xl font-bold tracking-tight">
        Connexion non configurée
      </h1>
      <ol className="list-decimal space-y-2 ps-5 text-sm text-foreground-muted">
        <li>
          Générez une clé de signature de session :{" "}
          <code>openssl rand -base64 32</code>
        </li>
        <li>
          Ajoutez-la dans <code>.env.local</code>, avec les identifiants Discord
          si vous voulez aussi ce mode de connexion :
        </li>
      </ol>
      <pre className="overflow-x-auto rounded-2xl bg-background-muted p-4 text-sm">
        <code>
          {
            "AUTH_SECRET=…\nDISCORD_CLIENT_ID=…\nDISCORD_CLIENT_SECRET=…"
          }
        </code>
      </pre>
      <p className="text-sm text-foreground-muted">
        Relancez ensuite{" "}
        <code className="rounded-md bg-background-muted px-1.5 py-0.5">
          npm run dev
        </code>
        .
      </p>
    </Shell>
  );
}

export async function SignInPanel({
  error,
  returnTo,
  mode,
}: {
  error?: string;
  returnTo?: string;
  mode?: string;
}) {
  if (!hasSessionSecret()) return <NotConfigured />;

  const user = await getSession();
  const destination = safeReturnTo(returnTo);
  const message = error ? (ERRORS[error] ?? ERRORS.discord) : null;

  if (user) {
    return (
      <Shell>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">Déjà connecté</h1>
          <p className="flex items-center gap-2 text-sm text-foreground-muted">
            <Check size={18} className="shrink-0" />
            Connecté en tant que{" "}
            <span className="font-medium text-foreground-strong">
              {user.name}
            </span>
          </p>
        </div>
        <Button className="w-full rounded-full" render={<Link href={destination ?? "/"} />}>
          Continuer
        </Button>
      </Shell>
    );
  }

  return (
    <div className='max-w-sm space-y-4 flex flex-col mx-auto h-140 my-auto'>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Connexion</h1>
        <p className="text-sm text-foreground-muted">
          E-mail et mot de passe, ou Discord. Votre liste de favoris suit votre
          compte.
        </p>
      </div>

      {message && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-2xl bg-background-muted px-3.5 py-3 text-sm text-foreground-muted"
        >
          <AlertCircle size={20} className="shrink-0" />
          {message}
        </p>
      )}

      <CredentialsForm
        returnTo={destination}
        initialMode={mode === "signup" ? "signup" : "signin"}
      />

      {isDiscordConfigured() && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-foreground-subtle">ou</span>
            <Separator className="flex-1" />
          </div>

          <DiscordSignInButton
            size="lg"
            returnTo={destination}
            className="w-full"
          />
        </>
      )}
    </div>
  );
}
