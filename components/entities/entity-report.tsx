import type React from "react";

import { StatusBadge } from "@/components/entities/status-badge";
import { InsightCallout } from "@/components/entities/report/insight-callout";
import { KpiTile } from "@/components/entities/report/kpi-tile";
import { ReportSection } from "@/components/entities/report/report-section";
import {
  deriveKpisFromFrontmatter,
  extractMetricsFromText,
  parseReportBody,
} from "@/lib/content/report-format";
import type { EntityDoc, ReportKpi } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/**
 * Visualização de leitura de uma entidade — o "relatório" que o founder LÊ e
 * aprova. Hero editorial, faixa de KPIs (do `report`, ou derivada dos campos
 * por-tipo, ou pescada do texto), callouts de insights e o corpo como prosa
 * rica. Server Component puro; a edição vive em outro componente.
 */
export function EntityReport({ doc }: { doc: EntityDoc }): React.JSX.Element {
  const fm = doc.frontmatter;

  // Faixa de KPIs: report > campos por-tipo > métricas soltas do texto.
  const kpis = resolveKpis(doc);

  const insights = fm.report?.insights ?? [];
  const { sections } = parseReportBody(doc.body);

  return (
    <div className="flex w-full flex-col gap-10">
      {/* HERO */}
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {fm.title}
        </h1>

        {fm.summary && (
          <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {fm.summary}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="font-mono text-xs">{fm.id}</span>
          <span aria-hidden>·</span>
          <span>revisão {fm.revision}</span>
          <span aria-hidden>·</span>
          <StatusBadge status={fm.status} />
          {formatDate(fm.updated) && (
            <>
              <span aria-hidden>·</span>
              <span>atualizado {formatDate(fm.updated)}</span>
            </>
          )}
        </div>

        {fm.report?.generated_at && formatDate(fm.report.generated_at) && (
          <p className="text-xs text-muted-foreground/80">
            Dados atualizados em {formatDate(fm.report.generated_at)}
          </p>
        )}
      </header>

      {/* FAIXA DE KPIs — omitida por completo se não houver nenhum */}
      {kpis.length > 0 && (
        <div className={cn("grid gap-4", gridColsFor(kpis.length))}>
          {kpis.map((kpi, i) => (
            <KpiTile key={`${kpi.label}-${i}`} kpi={kpi} />
          ))}
        </div>
      )}

      {/* INSIGHTS */}
      {insights.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Insights
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight, i) => (
              <InsightCallout key={i} insight={insight} />
            ))}
          </div>
        </section>
      )}

      {/* CONTEÚDO */}
      {sections.length > 0 ? (
        <div className="flex flex-col gap-6">
          {sections.map((section, i) => (
            <ReportSection
              key={i}
              heading={section.heading}
              blocks={section.blocks}
            />
          ))}
        </div>
      ) : (
        <p className="text-base text-muted-foreground">
          Este relatório ainda não tem conteúdo — gere ou edite.
        </p>
      )}
    </div>
  );
}

/** Resolve a faixa de KPIs pela cascata report -> campos por-tipo -> texto. */
function resolveKpis(doc: EntityDoc): ReportKpi[] {
  const reportKpis = doc.frontmatter.report?.kpis ?? [];
  if (reportKpis.length) return reportKpis;

  const derived = deriveKpisFromFrontmatter(doc.frontmatter);
  if (derived.length) return derived;

  return extractMetricsFromText(doc.body).map((m) => ({
    label: m.label ?? "Destaque",
    value: m.value,
    kind: "fact" as const,
  }));
}

/** Colunas do grid conforme a quantidade — evita tiles órfãos esticados. */
function gridColsFor(count: number): string {
  if (count <= 1) return "";
  if (count === 2) return "sm:grid-cols-2";
  if (count === 3) return "sm:grid-cols-2 lg:grid-cols-3";
  return "sm:grid-cols-2 lg:grid-cols-4";
}

/** Data ISO -> "11 de jul. de 2026" (pt-BR); string vazia se inválida. */
function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
