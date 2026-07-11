import matter from "gray-matter";

/**
 * Parse/stringify de arquivos de entidade via gray-matter, com ORDEM CANONICA de
 * chaves para diffs estaveis no git (docs/04 §6.3 e docs/02 §10.4 passo 10).
 *
 * Ordem canonica:
 *   id, section, entity, title, status, summary, tags, owner, order,
 *   created, updated, revision, last_edited_by, schema_version, ai_context,
 *   <campos por-tipo em ordem alfabetica>.
 *
 * JS preserva a ordem de insercao de chaves string; js-yaml (via gray-matter)
 * respeita essa ordem ao serializar.
 */

const CORE_ORDER = [
  "id",
  "section",
  "entity",
  "title",
  "status",
  "summary",
  "tags",
  "owner",
  "order",
  "created",
  "updated",
  "revision",
  "last_edited_by",
  "schema_version",
] as const;

/** Ordem interna estavel das chaves de ai_context. */
const AI_CONTEXT_ORDER = [
  "purpose",
  "write_policy",
  "read_when",
  "related",
  "instructions",
] as const;

const CORE_SET = new Set<string>([...CORE_ORDER, "ai_context"]);

function orderAiContext(ai: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of AI_CONTEXT_ORDER) {
    if (ai[k] !== undefined) out[k] = ai[k];
  }
  // chaves extras (nao previstas) mantidas apos as canonicas, em ordem alfabetica
  for (const k of Object.keys(ai).sort()) {
    if (!(k in out) && ai[k] !== undefined) out[k] = ai[k];
  }
  return out;
}

/** Reordena o objeto de frontmatter na ordem canonica. */
export function orderFrontmatter(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const k of CORE_ORDER) {
    if (data[k] !== undefined) out[k] = data[k];
  }

  const ai = data.ai_context;
  if (ai !== undefined) {
    out.ai_context =
      ai && typeof ai === "object" && !Array.isArray(ai)
        ? orderAiContext(ai as Record<string, unknown>)
        : ai;
  }

  const perType = Object.keys(data)
    .filter((k) => !CORE_SET.has(k))
    .sort();
  for (const k of perType) {
    if (data[k] !== undefined) out[k] = data[k];
  }

  return out;
}

/**
 * Serializa frontmatter + corpo em uma string MD com a ordem canonica de chaves.
 * Normaliza quebras de linha para LF (Windows-safe).
 */
export function stringifyEntity(
  data: Record<string, unknown>,
  body: string,
): string {
  const ordered = orderFrontmatter(data);
  const normalizedBody = body.replace(/\r\n/g, "\n");
  const out = matter.stringify(normalizedBody, ordered);
  return out.replace(/\r\n/g, "\n");
}

/** Faz parse de uma string MD -> { data (frontmatter cru), body }. Normaliza LF. */
export function parseEntity(raw: string): {
  data: Record<string, unknown>;
  body: string;
} {
  const normalized = raw.replace(/\r\n/g, "\n");
  const parsed = matter(normalized);
  return {
    data: parsed.data as Record<string, unknown>,
    body: parsed.content,
  };
}
