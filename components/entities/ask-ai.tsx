"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { AiUnavailableButton } from "@/components/entities/ai-unavailable-button";
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
import { requestAiFill } from "@/lib/ai/fill-client";
import { cn } from "@/lib/utils";

export interface AskAiProps {
  id: string;
  title: string;
  /** slug do agente responsável, ou `null` se a entidade é `founder_only`. */
  agentSlug: string | null;
  /** IA ligada no runtime? (cabo solto: presença da ANTHROPIC_API_KEY). */
  aiEnabled?: boolean;
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
 * Ponto de entrada da UI para "pedir uma proposta à IA" (docs/05 §7).
 *
 * Se a entidade é `founder_only` (`agentSlug === null`), mostra apenas um
 * lembrete. Caso contrário:
 *  - `aiEnabled`: o Dialog gera a proposta no runtime (chama a API, que grava
 *    como `needs_review`); o comando para o Claude Code fica como alternativa.
 *  - `!aiEnabled`: o botão aparece desabilitado com tooltip explicando que falta
 *    a `ANTHROPIC_API_KEY`.
 */
export function AskAi({ id, title, agentSlug, aiEnabled = true, className }: AskAiProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);

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

  if (!aiEnabled) {
    return (
      <AiUnavailableButton variant="outline" size="sm" className={className}>
        <Sparkles aria-hidden />
        Pedir à IA
      </AiUnavailableButton>
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

  async function handleGenerate(): Promise<void> {
    setRunning(true);
    try {
      const result = await requestAiFill({ id, mode: "draft" });
      if (result.ok) {
        toast.success("Proposta gerada — revise e aprove na barra de proposta.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

        <Button
          type="button"
          variant="brand"
          onClick={handleGenerate}
          disabled={running}
        >
          {running ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Gerando proposta...
            </>
          ) : (
            <>
              <Sparkles aria-hidden />
              Gerar proposta com IA
            </>
          )}
        </Button>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            Ou copie o comando para rodar no Claude Code
          </p>
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
