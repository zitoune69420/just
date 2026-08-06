import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPanel, SignInPanelSkeleton } from "@/components/sign-in-panel";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous avec Discord pour retrouver votre liste.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string; mode?: string }>;
}) {
  return (
    <Suspense fallback={<SignInPanelSkeleton />}>
      {searchParams.then(({ error, returnTo, mode }) => (
        <SignInPanel error={error} returnTo={returnTo} mode={mode} />
      ))}
    </Suspense>
  );
}
