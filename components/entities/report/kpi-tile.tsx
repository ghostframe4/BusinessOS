import { ExternalLink } from "lucide-react";

import { formatSourceHost } from "@/lib/content/report-format";
import type { ReportKpi } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export interface KpiTileProps {
  kpi: ReportKpi;
  className?: string;
}

/**
 * Cartão de um KPI da faixa de dados. Valor grande em cima; rótulo e nota
 * abaixo. `goal` ganha o chip "meta" (limão); `fact` com fonte mostra o link
 * discreto e, sem fonte, um acento lavanda sutil (dado decorativo).
 */
export function KpiTile({ kpi, className }: KpiTileProps) {
  const isGoal = kpi.kind === "goal";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border bg-card p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "tabular font-bold leading-tight tracking-tight",
            // Valor curto ganha destaque de "número grande"; valor longo (uma
            // faixa ou frase) recua de tamanho para não quebrar em cascata.
            valueSizeClass(kpi.value),
          )}
        >
          {kpi.value}
        </span>

        {isGoal ? (
          <span className="shrink-0 rounded-full bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand-foreground">
            meta
          </span>
        ) : kpi.source ? (
          <a
            href={kpi.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-full text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {kpi.source_label ?? formatSourceHost(kpi.source)}
            <ExternalLink className="size-3 shrink-0" aria-hidden />
          </a>
        ) : (
          <span
            className="mt-1 size-1.5 shrink-0 rounded-full bg-lavender"
            aria-hidden
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{kpi.label}</span>
        {kpi.note && (
          <span className="text-xs text-muted-foreground/80">{kpi.note}</span>
        )}
      </div>
    </div>
  );
}

/** Escala o valor pelo comprimento: número curto grande, faixa/frase menor. */
function valueSizeClass(value: string): string {
  const len = value.length;
  if (len <= 10) return "text-2xl md:text-3xl";
  if (len <= 20) return "text-xl md:text-2xl";
  return "text-base md:text-lg";
}
