import { z } from "zod";

/**
 * Schema do frontmatter das entidades — tipos TS + validacao zod v4.
 * Fonte unica de verdade da FORMA dos arquivos MD (docs/02-content-model.md §7).
 * Chaves/enums em ingles (identificadores); conteudo em pt-BR.
 */

// ---------------------------------------------------------------------------
// Tipos TypeScript (contrato publico importado por UI e agentes)
// ---------------------------------------------------------------------------

export type Section = "founder" | "direcao" | "validacao" | "caixa";

export type Status =
  | "empty"
  | "draft"
  | "in_progress"
  | "needs_review"
  | "validated"
  | "archived";

export type WritePolicy = "founder_only" | "propose" | "open";

export type Editor = "founder" | "system" | `agent:${string}`;

export interface AiContext {
  /** Para que serve esta entidade, em termos de agente. */
  purpose: string;
  /** Situacoes em que um agente deve ler este arquivo. */
  read_when?: string[];
  /** Permissao de escrita de agentes. Default 'propose'. */
  write_policy?: WritePolicy;
  /** ids de entidades relacionadas (montagem de contexto). */
  related?: string[];
  /** Orientacao livre ao agente (limites, tom, o que evitar). */
  instructions?: string;
}

/**
 * Um KPI do relatorio: um numero/fato de destaque com sua natureza e fonte.
 * `kind: 'fact'` = dado externo verificavel (exige `source`, uma URL confiavel);
 * `kind: 'goal'` = meta/expectativa do proprio negocio (rotulada como tal na UI).
 * Gerado por agentes de pesquisa (`report`) ou derivado de campos por-tipo.
 */
export interface ReportKpi {
  /** Rotulo curto do indicador (ex.: "Mercado LatAm", "Meta de membros"). */
  label: string;
  /** Valor formatado, como texto (ex.: "US$ 4,2 bi", "100 mil", "R$ 10 mil/mes"). */
  value: string;
  /** `fact` = fato externo com fonte; `goal` = meta/expectativa do negocio. */
  kind: "fact" | "goal";
  /** URL da fonte (obrigatoria em `fact`): de onde veio o dado. */
  source?: string;
  /** Nome legivel da fonte (ex.: "IMARC 2024") para exibir no lugar da URL crua. */
  source_label?: string;
  /** Nota curta de contexto (ex.: "CAGR ~20,7%", "ate 2033"). */
  note?: string;
}

/** Um insight do relatorio: uma leitura/conclusao curta, opcionalmente com fonte. */
export interface ReportInsight {
  /** O insight em uma frase (o "e dai" acionavel). */
  text: string;
  /** URL de apoio, se o insight se ancora num dado externo. */
  source?: string;
  /** Nome legivel da fonte. */
  source_label?: string;
}

/**
 * Bloco de relatorio de uma entidade (docs/02 — campo transversal opcional).
 * Curado por agentes de pesquisa: KPIs (fatos com fonte + metas) e insights.
 * A UI (EntityReport) renderiza isto como a camada de "dados"; ausente => a
 * visualizacao usa apenas o editorial + campos por-tipo do frontmatter.
 */
export interface Report {
  /** Data ISO em que o relatorio foi gerado/atualizado pelo agente. */
  generated_at?: string;
  /** Slug do agente que gerou (sem o prefixo `agent:`). */
  generated_by?: string;
  kpis: ReportKpi[];
  insights: ReportInsight[];
}

/** Campos core presentes em toda entidade. Campos por-tipo entram via extensao. */
export interface Frontmatter {
  id: `${Section}/${string}`;
  section: Section;
  entity: string;
  title: string;
  status: Status;
  summary: string;
  tags: string[];
  owner: string; // email
  order: number; // int >= 0
  created: string; // ISO 8601
  updated: string; // ISO 8601
  revision: number; // int >= 1
  last_edited_by: Editor;
  ai_context: AiContext;
  schema_version: 1;
  /** Bloco de relatorio (KPIs + insights), transversal e opcional. */
  report?: Report;
  // Campos por-tipo (opcionais) — ver docs/02 §8.2 / entity-extensions.ts:
  [key: string]: unknown;
}

/** Documento completo: frontmatter + corpo Markdown + caminho no disco. */
export interface EntityDoc {
  frontmatter: Frontmatter;
  body: string; // Markdown apos o frontmatter
  path: string; // ex.: 'content/direcao/tese-de-valor.md'
}

/** Projecao usada por listagens/cards (nao carrega o corpo). */
export interface EntityMeta {
  id: string;
  section: Section;
  entity: string;
  title: string;
  status: Status;
  summary: string;
  tags: string[];
  order: number;
  updated: string;
  last_edited_by: Editor;
}

// ---------------------------------------------------------------------------
// Schemas zod v4 (validacao em runtime)
// ---------------------------------------------------------------------------

export const sectionEnum = z.enum(["founder", "direcao", "validacao", "caixa"]);

export const statusEnum = z.enum([
  "empty",
  "draft",
  "in_progress",
  "needs_review",
  "validated",
  "archived",
]);

export const writePolicyEnum = z.enum(["founder_only", "propose", "open"]);

export const editorSchema = z.union([
  z.literal("founder"),
  z.literal("system"),
  z.string().regex(/^agent:[a-z0-9-]+$/),
]);

export const aiContextSchema = z.object({
  purpose: z.string().min(1),
  read_when: z.array(z.string()).optional(),
  write_policy: writePolicyEnum.default("propose"),
  related: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

export const reportKpiSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  kind: z.enum(["fact", "goal"]),
  source: z.url().optional(),
  source_label: z.string().optional(),
  note: z.string().optional(),
});

export const reportInsightSchema = z.object({
  text: z.string().min(1),
  source: z.url().optional(),
  source_label: z.string().optional(),
});

export const reportSchema = z.object({
  generated_at: z.string().optional(),
  generated_by: z.string().optional(),
  kpis: z.array(reportKpiSchema),
  insights: z.array(reportInsightSchema),
});

/**
 * Schema base (campos core). `.catchall(z.unknown())` (zod v4) deixa os campos
 * por-tipo passarem; a validacao dos campos por-tipo vem da extensao por-id
 * (entity-extensions.ts), combinada em `frontmatterSchema.and(getExtension(id))`.
 */
export const frontmatterSchema = z
  .object({
    id: z.string().regex(/^[a-z-]+\/[a-z0-9-]+$/),
    section: sectionEnum,
    entity: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    status: statusEnum,
    summary: z.string(),
    tags: z.array(z.string()),
    owner: z.email(),
    order: z.number().int().min(0),
    created: z.iso.datetime({ offset: true }),
    updated: z.iso.datetime({ offset: true }),
    revision: z.number().int().min(1),
    last_edited_by: editorSchema,
    ai_context: aiContextSchema,
    schema_version: z.literal(1),
    report: reportSchema.optional(),
  })
  .catchall(z.unknown())
  .refine((d) => d.id === `${d.section}/${d.entity}`, {
    message: "id deve ser exatamente `<section>/<entity>`",
    path: ["id"],
  });

export type FrontmatterInput = z.input<typeof frontmatterSchema>;
export type FrontmatterParsed = z.output<typeof frontmatterSchema>;
