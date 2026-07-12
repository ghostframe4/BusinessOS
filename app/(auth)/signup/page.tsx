import type { Metadata } from "next";

import { signUp } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Criar conta · BusinessOS" };

export default function SignupPage() {
  return (
    <AuthForm
      title="Criar conta"
      subtitle="Comece com os cards vazios e preencha ao seu ritmo."
      action={signUp}
      submitLabel="Criar conta"
      footerText="Já tem conta?"
      footerHref="/login"
      footerLinkLabel="Entrar"
      isSignup
    />
  );
}
