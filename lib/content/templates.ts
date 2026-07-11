import { QUESTIONNAIRES } from "./questionnaire";

/**
 * Templates de corpo (headings `##`) por entidade (docs/02-content-model.md §8.3).
 * Skeleton que o seeder e os formularios usam para montar o corpo Markdown inicial.
 *
 * DERIVADO do questionario (`questionnaire.ts`): cada pergunta guiada mapeia para
 * um heading `##`, entao a estrutura do corpo tem uma fonte unica. Editar as
 * perguntas la ajusta automaticamente os headings do seed/validacao aqui.
 */
export const BODY_TEMPLATES: Record<string, string[]> = Object.fromEntries(
  Object.entries(QUESTIONNAIRES).map(([id, questions]) => [
    id,
    questions.map((q) => q.heading),
  ]),
);

/** Headings (`##`) do corpo de uma entidade, ou vazio se nao houver template. */
export function templateFor(id: string): string[] {
  return BODY_TEMPLATES[id] ?? [];
}

/**
 * Monta o corpo Markdown inicial: um H1 com o `title` seguido de um `##` por
 * heading do template (docs/02 §4). Usado no seed/criacao de arquivos.
 */
export function renderTemplateBody(title: string, headings: string[]): string {
  const lines: string[] = [`# ${title}`, ""];
  for (const h of headings) {
    lines.push(`## ${h}`, "");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
