import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPanel, SignInPanelSkeleton } from "@/components/sign-in-panel";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    returnTo?: string;
    mode?: string;
    reset?: string;
  }>;
}) {
  return (
    <Suspense fallback={<SignInPanelSkeleton />}>
      {searchParams.then(({ error, returnTo, mode, reset }) => (
        <SignInPanel
          error={error}
          returnTo={returnTo}
          mode={mode}
          reset={reset}
        />
      ))}
    </Suspense>
  );
}
