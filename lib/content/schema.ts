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
  })
  .catchall(z.unknown())
  .refine((d) => d.id === `${d.section}/${d.entity}`, {
    message: "id deve ser exatamente `<section>/<entity>`",
    path: ["id"],
  });

export type FrontmatterInput = z.input<typeof frontmatterSchema>;
export type FrontmatterParsed = z.output<typeof frontmatterSchema>;
