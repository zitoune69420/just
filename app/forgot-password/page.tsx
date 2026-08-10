import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getTranslator } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default async function ForgotPasswordPage() {
  const t = await getTranslator();

  return (
    <div className="enter mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="space-y-6 rounded-3xl border border-border/60 bg-background-subtle/60 p-8 backdrop-blur-sm">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("reset.requestTitle")}
          </h1>
          <p className="text-sm text-foreground-muted">
            {t("reset.requestSubtitle")}
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
