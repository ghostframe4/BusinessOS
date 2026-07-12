"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthState } from "./actions";

interface AuthFormProps {
  /** Titulo grande do card (ex.: "Entrar"). */
  title: string;
  /** Subtitulo curto abaixo do titulo. */
  subtitle: string;
  /** Server Action (signIn | signUp). */
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  /** Rotulo do botao primario (ex.: "Entrar"). */
  submitLabel: string;
  /** Texto do rodape (ex.: "Não tem conta?"). */
  footerText: string;
  /** Rota do link do rodape. */
  footerHref: string;
  /** Rotulo do link do rodape. */
  footerLinkLabel: string;
  /** `true` no signup: mostra dica de senha e autocomplete apropriado. */
  isSignup?: boolean;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Aguarde…" : label}
    </Button>
  );
}

/**
 * Form de autenticacao (login/signup) — client component. Usa `useActionState`
 * para exibir erros/infos inline em pt-BR sem sair da pagina. Visual coerente
 * com o design "Flux": card branco arredondado, inputs pill.
 */
export function AuthForm({
  title,
  subtitle,
  action,
  submitLabel,
  footerText,
  footerHref,
  footerLinkLabel,
  isSignup = false,
}: AuthFormProps) {
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-card p-8 shadow-sm">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="voce@empresa.com"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            minLength={isSignup ? 6 : undefined}
            placeholder="••••••••"
          />
          {isSignup && (
            <p className="text-xs text-muted-foreground">
              Ao menos 6 caracteres.
            </p>
          )}
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}
        {state.info && (
          <p
            role="status"
            className="rounded-2xl bg-brand-muted px-4 py-2.5 text-sm text-foreground"
          >
            {state.info}
          </p>
        )}

        <SubmitButton label={submitLabel} />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {footerText}{" "}
        <Link
          href={footerHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {footerLinkLabel}
        </Link>
      </p>
    </div>
  );
}
