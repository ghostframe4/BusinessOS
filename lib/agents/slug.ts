/**
 * Normalização de slug de agente — módulo PURO (sem `node:*`), seguro para
 * importar em Client Components. Compartilhado pelo repositório (server) e pelo
 * form de criação (client), para o preview do slug bater com o que é gravado.
 */

/** slug válido = kebab-case (nome do arquivo `.claude/agents/<slug>.md`). */
export const SLUG_RE = /^[a-z0-9-]+$/;

/** Combining diacritical marks (U+0300–U+036F), para remover acentos. */
const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

/** Normaliza uma string de entrada em um slug kebab-case válido. */
export function slugify(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // não-alfanumérico -> hífen
    .replace(/^-+|-+$/g, ""); // apara hífens nas pontas
}
