"use client";

import { useState } from "react";
import { Bot } from "lucide-react";

import { useKanbanDnd } from "@/components/kanban/use-kanban-dnd";
import { useLiveActivity } from "@/components/workflow/use-live-activity";
import { WorkflowCard } from "@/components/workflow/workflow-card";
import { isProposal } from "@/lib/content/agent-map";
import type { EntityMeta, Status } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/** Verbo pt-BR para a acao ao vivo do agente. */
const ACTION_VERB: Record<"read" | "write", string> = {
  read: "lendo",
  write: "escrevendo",
};

/**
 * Colunas do board = estágios do fluxo. Cada uma agrupa um ou mais `status` do
 * schema; `drop` é o status atribuído ao soltar um card nela (o canônico do
 * estágio). `archived` fica fora do board (trabalho encerrado).
 */
const COLUMNS: {
  key: string;
  label: string;
  hint: string;
  statuses: Status[];
  drop: Status;
}[] = [
  { key: "todo", label: "A iniciar", hint: "Sem conteúdo ainda", statuses: ["empty"], drop: "empty" },
  { key: "doing", label: "Em progresso", hint: "Rascunho em construção", statuses: ["draft", "in_progress"], drop: "in_progress" },
  { key: "review", label: "Aguardando você", hint: "Proposta da IA para aprovar", statuses: ["needs_review"], drop: "needs_review" },
  { key: "done", label: "Validado", hint: "Aprovado pelo founder", statuses: ["validated"], drop: "validated" },
];

export interface WorkflowBoardCard {
  entity: EntityMeta;
  /** Slug do agente responsável (`null` = founder_only). */
  agentSlug: string | null;
}

export interface WorkflowBoardProps {
  /** Cards vindos do servidor; viram estado local para o drag-and-drop. */
  initialCards: WorkflowBoardCard[];
}

/**
 * Board de workflow com drag-and-drop entre estágios. Arrastar um card muda o
 * `status` da entidade no estado local (a faixa "trabalhando agora" reage).
 *
 * Nota: o movimento é local (efêmero) — mudar o status de verdade passa pela
 * página da entidade (o modelo é "IA propõe, founder dispõe"). Aqui é para
 * reorganizar a visão; um recarregamento reflete de novo o disco.
 */
export function WorkflowBoard({ initialCards }: WorkflowBoardProps) {
  const [cards, setCards] = useState<WorkflowBoardCard[]>(initialCards);

  // Atividade AO VIVO: agentes operando os CLIs no terminal AGORA (polling).
  const liveActivity = useLiveActivity();

  const dnd = useKanbanDnd((id, columnKey) => {
    const col = COLUMNS.find((c) => c.key === columnKey);
    if (!col) return;
    setCards((prev) =>
      prev.map((c) =>
        c.entity.id === id && c.entity.status !== col.drop
          ? { ...c, entity: { ...c.entity, status: col.drop } }
          : c,
      ),
    );
  });

  const byColumn = COLUMNS.map((col) => ({
    ...col,
    items: cards.filter((c) => col.statuses.includes(c.entity.status)),
  }));

  // Slugs operando AO VIVO no terminal (ganham prioridade sobre "proposta").
  const liveSlugs = new Set(liveActivity.map((a) => a.slug));

  // Agentes com proposta pendente aguardando o founder — exceto os que já
  // aparecem ao vivo (para não duplicar o mesmo agente na faixa).
  const proposingAgents = Array.from(
    cards
      .filter(
        (c) => c.agentSlug && !liveSlugs.has(c.agentSlug) && isProposal(c.entity),
      )
      .reduce((map, c) => {
        const list = map.get(c.agentSlug!) ?? [];
        list.push(c.entity);
        return map.set(c.agentSlug!, list);
      }, new Map<string, EntityMeta[]>()),
  );

  const nothingHappening =
    liveActivity.length === 0 && proposingAgents.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Faixa "trabalhando agora": agentes com proposta pendente. */}
      <section
        aria-label="Agentes trabalhando agora"
        className="rounded-2xl bg-card p-4 shadow-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Trabalhando agora
        </p>
        {nothingHappening ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhum agente operando agora nem com proposta pendente. Rode um agente
            no terminal ou peça uma proposta a partir da página de uma entidade.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {/* AO VIVO: agentes operando os CLIs neste momento. */}
            {liveActivity.map((a) => (
              <li
                key={`live:${a.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-brand-muted px-3 py-1.5 text-sm ring-1 ring-brand/30"
              >
                <span className="relative flex size-2 shrink-0" aria-hidden>
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500/70" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono font-medium">{a.slug}</span>
                <span className="text-muted-foreground">
                  {ACTION_VERB[a.action]}
                  {a.title ? ` ${a.title}` : ""}
                </span>
              </li>
            ))}

            {/* Proposta pendente aguardando o founder. */}
            {proposingAgents.map(([slug, ents]) => (
              <li
                key={`proposal:${slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-lavender-muted px-3 py-1.5 text-sm"
              >
                <Bot className="size-3.5 shrink-0" aria-hidden />
                <span className="font-mono font-medium">{slug}</span>
                <span className="text-muted-foreground">
                  {ents.length === 1 ? ents[0].title : `${ents.length} propostas`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* O board. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {byColumn.map((col) => {
          const isOver = dnd.overColumn === col.key;
          return (
            <section
              key={col.key}
              {...dnd.columnProps(col.key)}
              aria-label={col.label}
              className={cn(
                "flex flex-col gap-3 rounded-3xl p-3 transition-colors",
                isOver ? "bg-brand-muted ring-2 ring-brand/40" : "bg-secondary/40",
              )}
            >
              <div className="flex items-baseline justify-between gap-2 px-1">
                <div className="flex flex-col">
                  <h2 className="text-sm font-semibold tracking-tight">
                    {col.label}
                  </h2>
                  <p className="text-xs text-muted-foreground">{col.hint}</p>
                </div>
                <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {col.items.length}
                </span>
              </div>

              <div className="flex min-h-24 flex-1 flex-col gap-3">
                {col.items.length === 0 ? (
                  <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted-foreground">
                    {isOver ? "Solte aqui" : "Vazio"}
                  </p>
                ) : (
                  col.items.map((c) => (
                    <WorkflowCard
                      key={c.entity.id}
                      entity={c.entity}
                      agentSlug={c.agentSlug}
                      isProposal={isProposal(c.entity)}
                      dragging={dnd.draggingId === c.entity.id}
                      dragProps={dnd.cardProps(c.entity.id)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
