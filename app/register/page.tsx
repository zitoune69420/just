import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Inscription",
  description: "Créez un compte pour suivre les films et séries qui vous intéressent.",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
