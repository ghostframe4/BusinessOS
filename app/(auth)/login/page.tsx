import type { Metadata } from "next";

import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Entrar · BusinessOS" };

export default function LoginPage() {
  return (
    <AuthForm
      title="Entrar"
      subtitle="Acesse o seu OS de decisão."
      action={signIn}
      submitLabel="Entrar"
      footerText="Não tem conta?"
      footerHref="/signup"
      footerLinkLabel="Criar conta"
    />
  );
}
