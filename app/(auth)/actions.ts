"use server";

import { redirect } from "next/navigation";

import { seedEntitiesForUser, withUserContext } from "@/lib/content/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Actions de autenticacao (ADR 0001 §4/§5). Email + senha via Supabase
 * Auth. Erros retornam inline em pt-BR (consumidos por `useActionState`); o
 * sucesso redireciona (o `redirect` lanca — fica fora do try).
 */

/** Estado de retorno dos forms de auth (erro/informacao inline). */
export type AuthState = { error?: string; info?: string };

function readCredentials(formData: FormData): { email: string; password: string } {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

/** Entrar com email + senha. Sucesso -> `/founder`. */
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "E-mail ou senha inválidos." };
  }

  redirect("/founder");
}

/**
 * Criar conta com email + senha. Se a sessao vier na hora (confirmacao de
 * e-mail desabilitada), dispara o onboarding: semeia as 11 entidades vazias do
 * novo usuario e entra na app. Se a confirmacao estiver ligada (sem sessao),
 * informa que e preciso confirmar o e-mail.
 */
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }
  if (password.length < 6) {
    return { error: "A senha precisa ter ao menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    return { error: "Não foi possível criar a conta. Tente outro e-mail." };
  }

  // Sem sessao => "Confirm email" ligado no projeto. Como nao ha SMTP, o link
  // nunca chega — entao auto-confirmamos via service_role e logamos na hora, para
  // o self-service funcionar (ADR 0001 §4). Quando SMTP for configurado, remover
  // este auto-confirm e deixar a confirmacao real por e-mail assumir.
  if (!data.session && data.user) {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true });
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return {
        error: "Conta criada, mas não foi possível entrar. Tente fazer login.",
      };
    }
  }

  // Onboarding: semeia os cards vazios do tenant recem-criado (idempotente).
  await withUserContext(() => seedEntitiesForUser());

  redirect("/founder");
}
