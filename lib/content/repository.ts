import { config } from "@/lib/config";

import { getExtension } from "./entity-extensions";
import {
  ConflictError,
  NotInRegistryError,
  PolicyError,
  ValidationError,
} from "./errors";
import { getEntityDef, REGISTRY, type EntityDef } from "./registry";
import {
  frontmatterSchema,
  type AiContext,
  type Editor,
  type EntityDoc,
  type EntityMeta,
  type Frontmatter,
  type Section,
  type WritePolicy,
} from "./schema";
import { getStore } from "./store";
import { renderTemplateBody, templateFor } from "./templates";

/**
 * PORTA UNICA de acesso a `content/` (docs/02 §10 e docs/04 §6).
 * UI (Server Actions/Route Handlers) e agentes/skills usam exatamente estas
 * funcoes. Ninguem le/escreve o filesystem de conteudo por fora.
 */

export interface WriteInput {
  id: string;
  editor: Editor; // 'founder' | 'system' | 'agent:<name>'
  baseRevision: number; // revision lido (conflito otimista)
  frontmatterPatch?: Partial<Frontmatter>; // campos a mesclar (campos de sistema ignorados)
  body?: string; // corpo Markdown novo (se ausente, mantem)
}

/** Campos imutaveis: patch neles e ignorado (docs/02 §10.4 passo 6). */
const IMMUTABLE_KEYS = [
  "id",
  "section",
  "entity",
  "created",
  "schema_version",
] as const;

/** Campos controlados pelo sistema: o chamador nunca os define diretamente. */
const SYSTEM_KEYS = [
  ...IMMUTABLE_KEYS,
  "revision",
  "updated",
  "last_edited_by",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pathForId(id: string): string {
  return `${config.CONTENT_ROOT}/${id}.md`;
}

/** Valida `data` com o schema base + extensao por-tipo; lanca ValidationError. */
function validateFrontmatter(id: string, data: unknown): Frontmatter {
  const schema = frontmatterSchema.and(getExtension(id));
  const result = schema.safeParse(data);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    const parts: string[] = [];
    for (const issue of result.error.issues) {
      const key = issue.path.map(String).join(".") || "(root)";
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
      parts.push(`${key}: ${issue.message}`);
    }
    throw new ValidationError(
      `Frontmatter invalido para ${id}: ${parts.join("; ")}`,
      fieldErrors,
    );
  }
  return result.data as unknown as Frontmatter;
}

/** Politica de escrita efetiva da entidade (ai_context.write_policy, com fallback). */
function resolvePolicy(
  fm: Record<string, unknown>,
  def: EntityDef,
): WritePolicy {
  const ai = fm.ai_context;
  if (ai && typeof ai === "object") {
    const wp = (ai as Record<string, unknown>).write_policy;
    if (wp === "founder_only" || wp === "propose" || wp === "open") return wp;
  }
  return def.defaultWritePolicy;
}

/**
 * Frontmatter de seed de uma entidade (docs/02 §8.4). `revision: 1`,
 * `last_edited_by: system`, `status: empty`, campos por-tipo ausentes.
 */
export function buildSeedFrontmatter(
  def: EntityDef,
  timestamp: string,
): Frontmatter {
  const ai_context: AiContext = {
    purpose: def.purpose,
    write_policy: def.defaultWritePolicy,
    ...(def.related ? { related: def.related } : {}),
  };
  return {
    id: def.id as Frontmatter["id"],
    section: def.section,
    entity: def.entity,
    title: def.title,
    status: "empty",
    summary: "",
    tags: [],
    owner: config.FOUNDER_EMAIL,
    order: def.order,
    created: timestamp,
    updated: timestamp,
    revision: 1,
    last_edited_by: "system",
    ai_context,
    schema_version: 1,
  };
}

function toMeta(fm: Frontmatter): EntityMeta {
  return {
    id: fm.id,
    section: fm.section,
    entity: fm.entity,
    title: fm.title,
    status: fm.status,
    summary: fm.summary,
    tags: fm.tags,
    order: fm.order,
    updated: fm.updated,
    last_edited_by: fm.last_edited_by,
  };
}

// ---------------------------------------------------------------------------
// API publica
// ---------------------------------------------------------------------------

/** Le uma entidade completa (frontmatter validado + corpo). (docs/02 §10.3) */
export async function readEntity(id: string): Promise<EntityDoc> {
  const def = getEntityDef(id);
  if (!def) throw new NotInRegistryError(`Entidade fora do registro: ${id}`);

  const raw = await getStore().read(id);
  if (!raw) {
    throw new Error(`Arquivo de entidade nao encontrado: ${pathForId(id)}`);
  }

  const frontmatter = validateFrontmatter(id, raw.data);
  return { frontmatter, body: raw.body, path: pathForId(id) };
}

/**
 * Lista as entidades (opcionalmente de uma secao) como EntityMeta, ordenadas por
 * `order` asc. Dirigida pelo REGISTRY: arquivos fora do registro sao ignorados;
 * arquivos invalidos sao avisados e pulados (nao derrubam a listagem). (docs/02 §11)
 */
export async function listEntities(section?: Section): Promise<EntityMeta[]> {
  const raws = await getStore().list(section);

  const byId = new Map<string, Record<string, unknown>>();
  for (const raw of raws) {
    const id = raw.data?.id;
    if (typeof id === "string") byId.set(id, raw.data);
  }

  const defs = REGISTRY.filter((d) => (section ? d.section === section : true));
  const metas: EntityMeta[] = [];
  for (const def of defs) {
    const data = byId.get(def.id);
    if (!data) continue; // arquivo ausente (seeder ainda nao rodou) — sem card orfao
    try {
      metas.push(toMeta(validateFrontmatter(def.id, data)));
    } catch (e) {
      console.warn(
        `[content] ignorando entidade invalida ${def.id}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  metas.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return metas;
}

/**
 * Escreve uma entidade aplicando TODAS as regras do contrato (docs/02 §10.4 /
 * docs/04 §6.2): registry, conflito por revision, write_policy, campos de sistema
 * imutaveis, propose -> needs_review, validacao zod, ordenacao canonica e escrita
 * atomica (delegada ao store).
 */
export async function writeEntity(input: WriteInput): Promise<EntityDoc> {
  const def = getEntityDef(input.id);
  if (!def) throw new NotInRegistryError(`Entidade fora do registro: ${input.id}`);

  const store = getStore();
  const now = new Date().toISOString();

  // 2. Estado atual (pode nao existir => criacao).
  const existing = await store.read(input.id);
  let currentFm: Frontmatter;
  let currentBody: string;
  if (existing) {
    currentFm = validateFrontmatter(input.id, existing.data);
    currentBody = existing.body;
  } else {
    // Criacao: base = seed em revision 0 (a primeira escrita vira revision 1).
    currentFm = { ...buildSeedFrontmatter(def, now), revision: 0 };
    currentBody = renderTemplateBody(def.title, templateFor(def.id));
  }

  // 3. Conflito otimista.
  if (currentFm.revision !== input.baseRevision) {
    throw new ConflictError(
      `Conflito de revisao em ${input.id}: baseRevision=${input.baseRevision}, atual=${currentFm.revision}.`,
      currentFm.revision,
    );
  }

  // 4. Politica: gate pela politica ATUAL (agente nao pode liberar a si mesmo).
  const policy = resolvePolicy(currentFm, def);
  const isAgent = input.editor.startsWith("agent:");
  if (isAgent && policy === "founder_only") {
    throw new PolicyError(
      `Escrita de agente bloqueada em ${input.id} (write_policy=founder_only).`,
    );
  }

  // Patch sem campos de sistema (imutaveis + controlados).
  const patch: Record<string, unknown> = { ...(input.frontmatterPatch ?? {}) };
  for (const k of SYSTEM_KEYS) delete patch[k];

  // 5. Merge.
  const next: Record<string, unknown> = { ...currentFm, ...patch };

  // 6. Campos controlados pelo sistema / imutaveis.
  next.id = def.id;
  next.section = def.section;
  next.entity = def.entity;
  next.created = currentFm.created;
  next.schema_version = 1;
  next.updated = now;
  next.revision = currentFm.revision + 1;
  next.last_edited_by = input.editor;

  // 7. Fluxo de proposta: agente sob 'propose' entra como needs_review.
  if (isAgent && policy === "propose") {
    next.status = "needs_review";
  }

  // 8. Corpo.
  const nextBody = input.body ?? currentBody;

  // 9. Validacao (base + extensao por-tipo).
  const validated = validateFrontmatter(input.id, next);

  // 10-11. Serializacao canonica + escrita atomica (delegadas ao store).
  await store.write(input.id, { data: validated, body: nextBody });

  // 12.
  return { frontmatter: validated, body: nextBody, path: pathForId(input.id) };
}
