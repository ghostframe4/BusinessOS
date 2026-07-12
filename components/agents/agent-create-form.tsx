"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  createNewAgent,
  type CreateAgentResult,
} from "@/app/(app)/agentes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/agents/slug";
import { cn } from "@/lib/utils";

export interface AgentCreateFormProps {
  className?: string;
  /**
   * Quando embutido num modal: chrome mais leve nas seções e, ao criar,
   * chama `onCreated` (fecha + revalida) em vez de navegar para o editor.
   * `onCancel` substitui a navegação de volta para /agentes.
   */
  embedded?: boolean;
  onCreated?: (slug: string) => void;
  onCancel?: () => void;
}

/**
 * Form de criação de um novo subagente. O "Nome" vira o slug (kebab-case),
 * usado como nome do arquivo `.claude/agents/<slug>.md`. Ao criar com sucesso,
 * navega para o editor do agente recém-criado (ou chama `onCreated` no modal).
 */
export function AgentCreateForm({
  className,
  embedded = false,
  onCreated,
  onCancel,
}: AgentCreateFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const slug = slugify(name);

  // Chrome das seções: card com sombra na página; borda sutil dentro do modal.
  const sectionClass = embedded
    ? "rounded-2xl border border-border/60 bg-background/40 p-5"
    : "rounded-3xl bg-card p-6 shadow-sm sm:p-8";

  const [state, formAction, isPending] = useActionState<
    CreateAgentResult | null,
    FormData
  >(
    async (_prev, formData) =>
      createNewAgent({
        slug: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? "").trim(),
        tools: String(formData.get("tools") ?? "").trim(),
        systemPrompt: String(formData.get("systemPrompt") ?? ""),
      }),
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Agente criado");
      if (embedded && onCreated) {
        onCreated(state.slug);
      } else {
        router.push(`/agentes/${state.slug}`);
      }
    }
  }, [state, router, embedded, onCreated]);

  const topError = state && !state.ok ? state.message : undefined;

  return (
    <form action={formAction} className={cn("flex flex-col gap-6", className)}>
      {topError && (
        <p
          role="alert"
          className="w-full rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {topError}
        </p>
      )}

      <section className={sectionClass}>
        <div className="flex w-full flex-col gap-5">
          <h3 className="text-base font-semibold tracking-tight">Identidade</h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: pesquisador de mercado"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Vira o slug{" "}
                <code className="font-mono">{slug || "…"}</code> — nome do
                arquivo e <code>agent:{slug || "…"}</code>.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tools">Ferramentas</Label>
              <Input
                id="tools"
                name="tools"
                placeholder="Read, Bash"
                defaultValue="Read, Bash"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Separe por vírgula. Deixe em branco para herdar o padrão.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Quando e como acionar este agente."
                className="min-h-24"
              />
              <p className="text-xs text-muted-foreground">
                Usada no roteamento de &quot;Pedir à IA&quot;.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold tracking-tight">
              System prompt
            </h3>
            <p className="text-sm text-muted-foreground">
              As instruções (Markdown) que definem o comportamento do agente.
            </p>
          </div>

          <Textarea
            name="systemPrompt"
            spellCheck={false}
            placeholder={"Voce e o agente `agent:<slug>`.\n\n## Regra de ouro\n..."}
            className="min-h-[24rem] font-mono text-sm leading-relaxed"
          />
        </div>
      </section>

      <footer className="flex w-full items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (embedded && onCancel ? onCancel() : router.push("/agentes"))}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="brand" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Criando...
            </>
          ) : (
            "Criar agente"
          )}
        </Button>
      </footer>
    </form>
  );
}
