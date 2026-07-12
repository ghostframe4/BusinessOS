"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  saveAgent,
  type SaveAgentResult,
} from "@/app/(app)/agentes/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AgentDoc } from "@/lib/agents/repository";
import { cn } from "@/lib/utils";

export interface AgentEditorProps {
  agent: AgentDoc;
  className?: string;
  /**
   * Quando embutido num modal: usa chrome mais leve nas seções e chama
   * `onSaved`/`onCancel` em vez de navegar. Na página (`embedded` ausente) o
   * comportamento original é preservado.
   */
  embedded?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
}

/**
 * Editor do system prompt de um subagente (`.claude/agents/<slug>.md`).
 * `name` e `tools` são apenas exibidos (imutáveis aqui); `description` e o
 * system prompt (corpo Markdown) são editáveis e salvos via `saveAgent`.
 */
export function AgentEditor({
  agent,
  className,
  embedded = false,
  onSaved,
  onCancel,
}: AgentEditorProps) {
  const router = useRouter();

  // Chrome das seções: card com sombra na página; borda sutil dentro do modal.
  const sectionClass = embedded
    ? "rounded-2xl border border-border/60 bg-background/40 p-5"
    : "rounded-3xl bg-card p-6 shadow-sm sm:p-8";

  const [description, setDescription] = useState(agent.description);
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);

  // Sincroniza quando o doc é revalidado no servidor (após salvar): reset de
  // estado em resposta a mudança de prop, feito em render — padrão recomendado
  // pelo React (https://react.dev/learn/you-might-not-need-an-effect).
  const [syncedFrom, setSyncedFrom] = useState(agent);
  if (syncedFrom !== agent) {
    setSyncedFrom(agent);
    setDescription(agent.description);
    setSystemPrompt(agent.systemPrompt);
  }

  const [state, formAction, isPending] = useActionState<
    SaveAgentResult | null,
    FormData
  >(
    async (_prev, formData) =>
      saveAgent({
        slug: agent.slug,
        description: String(formData.get("description") ?? "").trim(),
        systemPrompt: String(formData.get("systemPrompt") ?? ""),
      }),
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success("Agente salvo");
      onSaved?.();
    }
  }, [state, onSaved]);

  const dirty =
    description !== agent.description || systemPrompt !== agent.systemPrompt;
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

      {/* Campos full-width (design-system §9.3): container é `flex w-full`,
          nunca `mx-auto max-w-*` — para dividir, usar grid, não largura máx. */}
      <section className={sectionClass}>
        <div className="flex w-full flex-col gap-5">
          <h3 className="text-base font-semibold tracking-tight">Identidade</h3>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="agent-name">Nome (slug)</Label>
              <Input
                id="agent-name"
                value={agent.name}
                readOnly
                disabled
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Vira <code>agent:{agent.slug}</code> nos arquivos que ele propõe.
                Não editável aqui.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="agent-tools">Ferramentas</Label>
              <Input
                id="agent-tools"
                value={agent.tools || "—"}
                readOnly
                disabled
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Concedidas no frontmatter. Não editável aqui.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24"
              />
              <p className="text-xs text-muted-foreground">
                Quando e como acionar este agente (usada no roteamento de
                &quot;Pedir à IA&quot;).
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
              É o corpo de <code>.claude/agents/{agent.slug}.md</code>.
            </p>
          </div>

          <Textarea
            name="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            spellCheck={false}
            className="min-h-[28rem] font-mono text-sm leading-relaxed"
          />
        </div>
      </section>

      <footer className="flex w-full items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel ?? (() => router.push("/agentes"))}
          disabled={isPending}
        >
          {embedded ? "Fechar" : "Voltar"}
        </Button>
        <Button
          type="submit"
          variant="brand"
          disabled={isPending || !dirty}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </footer>
    </form>
  );
}
