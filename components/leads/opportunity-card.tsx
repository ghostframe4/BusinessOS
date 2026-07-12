import type { HTMLAttributes } from "react";
import { Bot, MapPin } from "lucide-react";

import { formatCnpj, type Company } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

export interface OpportunityCardProps {
  /** A oportunidade = uma empresa vista pelo funil. */
  company: Company;
  /** `true` enquanto este card está sendo arrastado (esmaece). */
  dragging?: boolean;
  /** Handlers/atributos de drag injetados pelo board (opcional). */
  dragProps?: HTMLAttributes<HTMLElement> & { draggable?: boolean };
}

/** Formata a data ISO (YYYY-MM-DD) em pt-BR curto (dd/mm). */
function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return day && month ? `${day}/${month}` : iso;
}

/** Cor do preenchimento da barra de fit. */
function scoreTone(score: number): string {
  if (score >= 80) return "bg-brand";
  if (score >= 60) return "bg-lavender";
  return "bg-muted-foreground/40";
}

/**
 * Card de uma oportunidade no kanban. Compacto: empresa + setor/cidade no topo,
 * fit (score) e nota do agente no meio, origem + agente que trouxe + data no
 * rodapé. Empacotado para caber numa coluna do board.
 */
export function OpportunityCard({
  company,
  dragging,
  dragProps,
}: OpportunityCardProps) {
  const cnpj = formatCnpj(company.cnpj);
  return (
    <article
      {...dragProps}
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60 transition hover:ring-border",
        dragProps?.draggable && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-50",
      )}
    >
      {/* Empresa + setor. */}
      <header className="flex flex-col gap-0.5">
        <span className="font-medium tracking-tight text-foreground">
          {company.name}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {company.sector && <span>{company.sector}</span>}
          {company.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              {company.city}
            </span>
          )}
        </span>
      </header>

      {/* Fit com a oferta. */}
      {typeof company.score === "number" && (
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            aria-hidden
          >
            <span
              className={cn(
                "block h-full rounded-full",
                scoreTone(company.score),
              )}
              style={{ width: `${company.score}%` }}
            />
          </span>
          <span className="tabular-nums text-xs text-muted-foreground">
            fit {company.score}
          </span>
        </div>
      )}

      {/* Nota do agente (por que é uma boa oportunidade). */}
      {company.note && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {company.note}
        </p>
      )}

      {/* Rodapé: origem + agente que trouxe + data. */}
      <footer className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {cnpj ? `CNPJ ${cnpj}` : company.source}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
          {company.foundBy && (
            <span className="flex items-center gap-1">
              <Bot className="size-3 shrink-0" aria-hidden />
              <span className="font-mono">{company.foundBy}</span>
            </span>
          )}
          <span className="tabular-nums">{shortDate(company.addedAt)}</span>
        </div>
      </footer>
    </article>
  );
}
