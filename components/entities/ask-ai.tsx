"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AGENT_PURPOSE } from "@/lib/content/agent-map";
import { cn } from "@/lib/utils";

export interface AskAiProps {
  id: string;
  title: string;
  /** slug do agente responsável, ou `null` se a entidade é `founder_only`. */
  agentSlug: string | null;
  className?: string;
}

/** Monta o comando pronto que o founder cola no Claude Code (docs/05 §7). */
function buildCommand(agentSlug: string, title: string, id: string): string {
  return (
    `Use o subagente @${agentSlug} para propor "${title}" (id ${id}). ` +
    `Leia o contexto via pnpm agent:read --id ${id} e escreva via pnpm agent:write.`
  );
}

/**
 * Ponto de entrada da UI para "pedir uma proposta a IA" (docs/05 §7).
 *
 * MVP sem chave de API: nada de rede/LLM aqui. Se a entidade é `founder_only`
 * (`agentSlug === null`), mostra apenas um lembrete. Caso contrário, abre um
 * Dialog com o agente responsável, seu propósito e o comando pronto (com botão
 * "Copiar") para o founder rodar no Claude Code.
 */
export function AskAi({ id, title, agentSlug, className }: AskAiProps) {
  const [copied, setCopied] = useState(false);

  if (agentSlug === null) {
    return (
      <p
        className={cn("text-xs text-muted-foreground", className)}
        aria-label="Esta entidade é editada apenas por você"
      >
        Somente você edita esta entidade.
      </p>
    );
  }

  const purpose = AGENT_PURPOSE[agentSlug] ?? "";
  const command = buildCommand(agentSlug, title, id);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success("Comando copiado");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o comando.");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className}>
          <Sparkles aria-hidden />
          Pedir à IA
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pedir uma proposta à IA</DialogTitle>
          <DialogDescription>
            O agente vai propor uma versão desta entidade para você aprovar —
            nada é publicado sem a sua revisão.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1 rounded-2xl bg-brand-muted p-4">
          <p className="text-sm font-medium">
            Agente responsável:{" "}
            <span className="font-mono">agent:{agentSlug}</span>
          </p>
          {purpose && (
            <p className="text-sm text-muted-foreground">{purpose}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Comando para o Claude Code</p>
          <div className="flex items-start gap-2 rounded-2xl bg-muted p-3">
            <code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-xs">
              {command}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={handleCopy}
              aria-label="Copiar comando"
            >
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
