import { randomBytes } from "node:crypto";
import { readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

import { SLUG_RE, slugify } from "./slug";

export { slugify } from "./slug";

/**
 * Acesso aos subagentes do projeto (`.claude/agents/<slug>.md`).
 *
 * Cada arquivo é um Markdown com frontmatter YAML (`name`, `description`,
 * `tools`) cujo CORPO é o system prompt do agente. Esta lib é a porta de
 * leitura/escrita da página `/agentes` da UI.
 *
 * IMPORTANTE: isto NÃO é `content/` (entidades de negócio) — a "regra de ouro"
 * do CLAUDE.md/repository.ts não se aplica. São arquivos de configuração dos
 * próprios agentes, editados aqui diretamente com fs (escrita atômica).
 */

/** Diretório dos subagentes, relativo à raiz do projeto. */
const AGENTS_DIR = path.join(process.cwd(), ".claude", "agents");

export interface AgentDoc {
  /** Identificador = nome do arquivo (`cash-flow`). */
  slug: string;
  /** `name` do frontmatter (normalmente igual ao slug). */
  name: string;
  /** Descrição curta (quando/como usar o agente). */
  description: string;
  /** Ferramentas concedidas (string bruta do frontmatter, ex.: "Read, Bash"). */
  tools: string;
  /** Frontmatter cru preservado (para reescrever sem perder chaves extras). */
  data: Record<string, unknown>;
  /** Corpo Markdown = system prompt do agente. */
  systemPrompt: string;
}

/** Metadados para a listagem (sem o corpo). */
export type AgentMeta = Omit<AgentDoc, "data" | "systemPrompt">;

/** Rejeita path traversal e valida o formato do slug. */
function assertSlug(slug: string): void {
  if (
    typeof slug !== "string" ||
    slug.includes("/") ||
    slug.includes("\\") ||
    slug.includes("..") ||
    slug.includes("\0") ||
    !SLUG_RE.test(slug)
  ) {
    throw new Error(`slug de agente inválido: ${String(slug)}`);
  }
}

function fileFor(slug: string): string {
  assertSlug(slug);
  return path.join(AGENTS_DIR, `${slug}.md`);
}

/** Normaliza o campo `description` (pode vir multi-linha do YAML). */
function normalizeDescription(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s*\n\s*/g, " ");
}

function toDoc(slug: string, raw: string): AgentDoc {
  // CRLF -> LF (Windows-safe), como o file-store de content.
  const parsed = matter(raw.replace(/\r\n/g, "\n"));
  const data = parsed.data as Record<string, unknown>;
  return {
    slug,
    name: typeof data.name === "string" ? data.name : slug,
    description: normalizeDescription(data.description),
    tools:
      typeof data.tools === "string"
        ? data.tools
        : Array.isArray(data.tools)
          ? data.tools.join(", ")
          : "",
    data,
    systemPrompt: parsed.content.trim(),
  };
}

/** Lê um subagente completo. Lança se o arquivo não existir. */
export async function readAgent(slug: string): Promise<AgentDoc> {
  const file = fileFor(slug);
  const raw = await readFile(file, "utf8");
  return toDoc(slug, raw);
}

/** Lê um subagente, ou `null` se o arquivo não existir. */
export async function findAgent(slug: string): Promise<AgentDoc | null> {
  try {
    return await readAgent(slug);
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

/** Lista todos os subagentes (ordenados por slug), sem o corpo. */
export async function listAgents(): Promise<AgentMeta[]> {
  let names: string[];
  try {
    names = await readdir(AGENTS_DIR);
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }

  const metas: AgentMeta[] = [];
  for (const name of names) {
    if (!name.endsWith(".md")) continue;
    const slug = name.slice(0, -3);
    if (!SLUG_RE.test(slug)) continue;
    try {
      const doc = await readAgent(slug);
      metas.push({
        slug: doc.slug,
        name: doc.name,
        description: doc.description,
        tools: doc.tools,
      });
    } catch (e) {
      console.warn(
        `[agents] ignorando agente inválido ${slug}: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  metas.sort((a, b) => a.slug.localeCompare(b.slug));
  return metas;
}

/** Slugs que colidem com rotas estáticas sob `/agentes` (não podem ser agentes). */
const RESERVED_SLUGS = new Set(["novo"]);

export interface CreateAgentInput {
  slug: string;
  /** Descrição curta (quando/como usar). */
  description: string;
  /** Ferramentas concedidas (string, ex.: "Read, Bash"). */
  tools: string;
  /** System prompt (corpo Markdown). */
  systemPrompt: string;
}

/**
 * Cria um novo subagente em `.claude/agents/<slug>.md`. Rejeita se o slug for
 * inválido ou já existir. Escrita atômica (temp + rename).
 */
export async function createAgent(input: CreateAgentInput): Promise<AgentDoc> {
  const slug = input.slug.trim();
  assertSlug(slug); // valida formato + path traversal

  if (RESERVED_SLUGS.has(slug)) {
    throw new Error(`"${slug}" é um nome reservado. Escolha outro.`);
  }
  if (await findAgent(slug)) {
    throw new Error(`Já existe um agente com o slug "${slug}".`);
  }

  const data: Record<string, unknown> = {
    name: slug,
    description: input.description.trim(),
  };
  const tools = input.tools.trim();
  if (tools) data.tools = tools;

  const body = input.systemPrompt.trim();
  const content = matter.stringify(`\n${body}\n`, data);

  const file = fileFor(slug);
  const tmp = path.join(
    AGENTS_DIR,
    `.${slug}.md.tmp-${randomBytes(6).toString("hex")}`,
  );
  await writeFile(tmp, content, "utf8");
  // `wx` garantiria atomicidade contra corrida, mas o rename já cobre o caso;
  // a checagem de existência acima trata o conflito comum.
  await rename(tmp, file);

  return toDoc(slug, content);
}

export interface WriteAgentInput {
  slug: string;
  /** Novo system prompt (corpo Markdown). */
  systemPrompt: string;
  /** Nova descrição (opcional; mantém a atual se ausente). */
  description?: string;
}

/**
 * Regrava o subagente preservando o frontmatter (`name`, `tools` e chaves
 * extras), atualizando `description` (se enviada) e o corpo (system prompt).
 * Escrita atômica: temporário no mesmo diretório + rename por cima.
 */
export async function writeAgent(input: WriteAgentInput): Promise<AgentDoc> {
  const current = await readAgent(input.slug); // valida slug + existência

  const nextData: Record<string, unknown> = { ...current.data };
  if (input.description !== undefined) {
    nextData.description = input.description.trim();
  }

  const body = input.systemPrompt.trim();
  // gray-matter serializa o frontmatter YAML e adiciona os delimitadores `---`.
  const content = matter.stringify(`\n${body}\n`, nextData);

  const file = fileFor(input.slug);
  const tmp = path.join(
    AGENTS_DIR,
    `.${input.slug}.md.tmp-${randomBytes(6).toString("hex")}`,
  );
  await writeFile(tmp, content, "utf8");
  await rename(tmp, file);

  return toDoc(input.slug, content);
}
