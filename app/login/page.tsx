import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous pour retrouver votre liste et vos recommandations.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
