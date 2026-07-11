"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  approveProposal,
  rejectProposal,
} from "@/app/(app)/[section]/[entity]/actions";

export interface ProposalBarProps {
  id: string;
  baseRevision: number;
  /** slug do agente (sem o prefixo `agent:`) que propôs o conteúdo. */
  agentSlug: string;
  className?: string;
}

/**
 * Banner de decisão sobre uma proposta de agente (docs/05 §6).
 * Aparece acima do form quando `isProposal(frontmatter)`: o conteúdo atual foi
 * escrito por `agent:<slug>` e aguarda o founder. "Aprovar" assume o conteúdo
 * (=> `in_progress`); "Rejeitar" marca como não-aprovado (=> `draft`).
 */
export function ProposalBar({
  id,
  baseRevision,
  agentSlug,
  className,
}: ProposalBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function decide(
    action: typeof approveProposal,
    successMessage: string,
  ): void {
    startTransition(async () => {
      const result = await action({ id, baseRevision });
      if (result.ok) {
        toast.success(successMessage);
        router.refresh(); // reflete o novo status vindo do servidor
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <section
      aria-label="Proposta de IA aguardando revisão"
      className={cn(
        "flex flex-col gap-3 rounded-3xl bg-lavender-muted p-5",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-lavender-foreground" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Proposto por IA —{" "}
            <span className="font-mono">agent:{agentSlug}</span>
          </p>
          <p className="text-sm text-foreground/70">
            Este conteúdo foi proposto por um agente e aguarda sua revisão.
            Aprovar assume a versão; rejeitar a marca como rascunho para você
            editar.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => decide(rejectProposal, "Proposta rejeitada")}
        >
          Rejeitar
        </Button>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => decide(approveProposal, "Proposta aprovada")}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Processando...
            </>
          ) : (
            "Aprovar"
          )}
        </Button>
      </div>
    </section>
  );
}
