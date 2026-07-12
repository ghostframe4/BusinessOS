"use client";

import { useState } from "react";

import { OpportunityCard } from "@/components/leads/opportunity-card";
import { useKanbanDnd } from "@/components/kanban/use-kanban-dnd";
import {
  countByStage,
  LEAD_STAGE_LABEL,
  LEAD_STAGES,
  type Company,
  type LeadStage,
} from "@/lib/leads/types";
import { cn } from "@/lib/utils";

/**
 * Cor do dot de cada coluna, espelhando a escala do `StageBadge` (sistema
 * "Flux"): neutro no topo do funil, lavanda nos estágios ativos, limão no
 * fechamento. Sinal redundante — o rótulo pt-BR está sempre visível ao lado.
 */
const STAGE_DOT: Record<LeadStage, string> = {
  new: "border border-muted-foreground/50 bg-transparent",
  contacted: "bg-muted-foreground/60",
  qualified: "bg-lavender",
  negotiating: "bg-brand",
  won: "bg-brand",
  lost: "bg-muted-foreground/40",
};

/** Estágios que contam como "oportunidade ativa" (ainda em jogo no funil). */
const ACTIVE_STAGES: LeadStage[] = [
  "new",
  "contacted",
  "qualified",
  "negotiating",
];

export interface OpportunitiesBoardProps {
  /** Empresas vindas do servidor; viram estado local para o drag-and-drop. */
  initialCompanies: Company[];
}

/**
 * Board de oportunidades com drag-and-drop entre estágios do funil. Cada card é
 * uma empresa (PJ). Arrastar muda o `stage` da empresa no estado local e os KPIs
 * recalculam na hora.
 *
 * Nota: o movimento é local (efêmero) — a base vem de `data/leads.json`. Quando
 * houver escrita, o `onMove` grava a mudança.
 */
export function OpportunitiesBoard({ initialCompanies }: OpportunitiesBoardProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);

  const dnd = useKanbanDnd((id, toColumn) => {
    const stage = toColumn as LeadStage;
    setCompanies((prev) =>
      prev.map((c) => (c.id === id && c.stage !== stage ? { ...c, stage } : c)),
    );
  });

  const counts = countByStage(companies);
  const active = ACTIVE_STAGES.reduce((sum, s) => sum + counts[s], 0);
  const closed = counts.won + counts.lost;
  const winRate = closed > 0 ? Math.round((counts.won / closed) * 100) : null;

  const kpis = [
    { label: "Ativas", value: active },
    { label: "Em negociação", value: counts.negotiating },
    { label: "Ganhas", value: counts.won },
    { label: "Taxa de ganho", value: winRate === null ? "—" : `${winRate}%` },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Faixa de KPIs do funil (reativa ao drag). */}
      <section
        aria-label="Resumo do funil"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col gap-1 rounded-xl bg-card p-4 shadow-sm"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {kpi.label}
            </span>
            <span className="text-3xl font-bold tabular-nums tracking-tight">
              {kpi.value}
            </span>
          </div>
        ))}
      </section>

      {/* O board — role no eixo com shift+scroll (sem barra). */}
      <div className="no-scrollbar -mx-6 overflow-x-auto px-6 pb-2 md:-mx-8 md:px-8">
        <div className="flex min-w-max gap-4">
          {LEAD_STAGES.map((stage) => {
            const items = companies.filter((c) => c.stage === stage);
            const isOver = dnd.overColumn === stage;
            return (
              <section
                key={stage}
                {...dnd.columnProps(stage)}
                aria-label={LEAD_STAGE_LABEL[stage]}
                className={cn(
                  "flex min-h-[calc(100dvh-17rem)] w-[22rem] shrink-0 flex-col gap-3 rounded-3xl p-3 transition-colors",
                  isOver
                    ? "bg-brand-muted ring-2 ring-brand/40"
                    : "bg-secondary/50",
                )}
              >
                <div className="flex items-center justify-between gap-2 px-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        STAGE_DOT[stage],
                      )}
                      aria-hidden
                    />
                    <h2 className="text-sm font-semibold tracking-tight">
                      {LEAD_STAGE_LABEL[stage]}
                    </h2>
                  </div>
                  <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  {items.length === 0 ? (
                    <p className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted-foreground">
                      {isOver ? "Solte aqui" : "Vazio"}
                    </p>
                  ) : (
                    items.map((company) => (
                      <OpportunityCard
                        key={company.id}
                        company={company}
                        dragging={dnd.draggingId === company.id}
                        dragProps={dnd.cardProps(company.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
