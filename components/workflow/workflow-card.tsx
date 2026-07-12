import type { HTMLAttributes } from "react";
import Link from "next/link";
import { Bot, User } from "lucide-react";

import { StatusBadge } from "@/components/entities/status-badge";
import { SECTION_LABEL } from "@/lib/content/labels";
import type { EntityMeta } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export interface WorkflowCardProps {
  entity: EntityMeta;
  /** Slug do agente responsável pela entidade (`null` = founder_only). */
  agentSlug: string | null;
  /** `true` quando há proposta pendente da IA (needs_review + agente). */
  isProposal: boolean;
  /** `true` enquanto este card está sendo arrastado (esmaece). */
  dragging?: boolean;
  /** Handlers/atributos de drag injetados pelo board (opcional). */
  dragProps?: HTMLAttributes<HTMLElement> & { draggable?: boolean };
}

/**
 * Card de uma entidade dentro do board de workflow. Mostra o título, a seção, o
 * status e — o ponto central — QUEM está responsável: o agente da alçada (ou o
 * founder, em entidades `founder_only`). Quando há proposta pendente, destaca
 * que o agente já propôs e aguarda o founder. O card inteiro leva à página da
 * entidade, onde o founder aprova (o board é só leitura — o modelo é
 * "IA propõe, founder dispõe").
 */
export function WorkflowCard({
  entity,
  agentSlug,
  isProposal,
  dragging,
  dragProps,
}: WorkflowCardProps) {
  return (
    <Link
      href={`/${entity.id}`}
      {...dragProps}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 transition hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isProposal ? "ring-lavender/60" : "ring-transparent",
        dragProps?.draggable && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground">
          {SECTION_LABEL[entity.section]}
        </span>
        <StatusBadge status={entity.status} />
      </div>

      <h3 className="text-sm font-semibold leading-snug tracking-tight">
        {entity.title}
      </h3>

      {entity.summary && (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {entity.summary}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-1">
        {agentSlug ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
              isProposal
                ? "bg-lavender-muted text-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
          >
            <Bot className="size-3 shrink-0" aria-hidden />
            <span className="font-mono">{agentSlug}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-transparent px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
            <User className="size-3 shrink-0" aria-hidden />
            Só founder
          </span>
        )}
        {isProposal && (
          <span className="text-xs font-medium text-muted-foreground">
            propôs — aguarda você
          </span>
        )}
      </div>
    </Link>
  );
}
