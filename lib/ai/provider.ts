import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject, generateText, stepCountIs } from "ai";
import { z } from "zod";

import { config } from "@/lib/config";
import { reportSchema, type Report } from "@/lib/content/schema";

/**
 * Integracao de IA no runtime (ADR 0001 §6) via Vercel AI SDK + `@ai-sdk/anthropic`.
 * Server-only: le a `ANTHROPIC_API_KEY` de `config`. Enquanto a chave nao existir,
 * este modulo nem e chamado (as rotas checam `AI_ENABLED` antes) — "cabo solto".
 *
 * A IA PROPOE; grava-se pela MESMA porta que os humanos (`writeEntity` com
 * `editor: 'agent:ai'` -> `status: needs_review`). Aqui ficam apenas os helpers
 * de geracao (texto/estrutura); a escrita mora na rota `app/api/ai/fill`.
 */

/**
 * Modelo Claude padrao. Trocavel por esta constante — aponte para outro id valido
 * (ex.: "claude-opus-4-8") sem mais mudancas de codigo, so reiniciando.
 */
export const AI_MODEL_ID = "claude-sonnet-4-5";

/** Contexto de uma entidade relacionada (profundidade 1) para ancorar a IA. */
export interface RelatedContext {
  id: string;
  title: string;
  summary: string;
  body: string;
}

/** Contexto que os helpers recebem para gerar uma proposta. */
export interface EntityDraftContext {
  id: string;
  title: string;
  section: string;
  purpose: string;
  instructions?: string;
  currentBody: string;
  related: RelatedContext[];
}

/** Uma proposta de conteudo: resumo do card + corpo Markdown. */
export interface EntityDraft {
  summary: string;
  body: string;
}

/** Resolve o provider + modelo. Lanca se a chave faltar (defesa em profundidade). */
function resolveModel() {
  const apiKey = config.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY ausente: a IA nao esta configurada.");
  }
  const anthropic = createAnthropic({ apiKey });
  return { anthropic, languageModel: anthropic(AI_MODEL_ID) };
}

const draftSchema = z.object({
  summary: z
    .string()
    .describe("Resumo de 1-2 frases, em pt-BR, que aparece no card."),
  body: z
    .string()
    .describe(
      "Corpo Markdown completo em pt-BR, comecando por um H1 igual ao titulo " +
        "e preservando os headings de secao existentes.",
    ),
});

const DRAFT_SYSTEM = [
  "Voce e um agente do BusinessOS, um OS de decisao para founders.",
  "Voce PROPOE conteudo; o founder aprova. Escreva sempre em pt-BR, direto e concreto.",
  "Regras do corpo: comece com um H1 exatamente igual ao titulo da entidade;",
  "preserve os headings de secao existentes (nao invente estrutura nova);",
  "preencha o que estiver vago a partir do contexto; nao invente fatos ausentes do contexto.",
].join(" ");

/** Monta o bloco de contexto (entidade atual + relacionadas) para o prompt. */
function contextBlock(ctx: EntityDraftContext): string {
  const related = ctx.related.length
    ? ctx.related
        .map(
          (r) =>
            `### ${r.title} (${r.id})\nResumo: ${r.summary || "(vazio)"}\n${r.body}`,
        )
        .join("\n\n")
    : "(nenhuma)";
  return [
    `Entidade: ${ctx.title} (id ${ctx.id}, secao ${ctx.section})`,
    `Proposito: ${ctx.purpose}`,
    ctx.instructions ? `Instrucoes: ${ctx.instructions}` : "",
    `\nConteudo atual:\n${ctx.currentBody || "(vazio)"}`,
    `\nEntidades relacionadas (contexto):\n${related}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Propoe uma nova versao da entidade (resumo + corpo). Usado pelo "Pedir a IA". */
export async function generateEntityDraft(
  ctx: EntityDraftContext,
  userPrompt?: string,
): Promise<EntityDraft> {
  const { languageModel } = resolveModel();
  const guidance = userPrompt?.trim()
    ? `\nOrientacao do founder: ${userPrompt.trim()}`
    : "";
  const { object } = await generateObject({
    model: languageModel,
    schema: draftSchema,
    system: DRAFT_SYSTEM,
    maxOutputTokens: 4096,
    prompt:
      `Proponha uma nova versao desta entidade.${guidance}\n\n` +
      contextBlock(ctx),
  });
  return object;
}

/** Sintetiza um briefing a partir das respostas do questionario (heading -> resposta). */
export async function generateBriefingDraft(
  ctx: EntityDraftContext,
  answers: { heading: string; answer: string }[],
): Promise<EntityDraft> {
  const { languageModel } = resolveModel();
  const block = answers
    .map((a) => `## ${a.heading}\n${a.answer.trim() || "(sem resposta)"}`)
    .join("\n\n");
  const { object } = await generateObject({
    model: languageModel,
    schema: draftSchema,
    system: DRAFT_SYSTEM,
    maxOutputTokens: 4096,
    prompt:
      "Sintetize um briefing claro a partir das respostas do founder abaixo. " +
      "Organize o corpo pelas secoes do questionario, preenchendo o que estiver vago.\n\n" +
      `Respostas:\n\n${block}\n\n---\n${contextBlock(ctx)}`,
  });
  return object;
}

/** Extrai o objeto JSON de uma resposta em texto (tolera cercas ```json). */
function extractJson(text: string): unknown {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence?.[1]) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("A IA nao retornou um JSON de relatorio valido.");
  }
  return JSON.parse(s.slice(start, end + 1));
}

/**
 * Pesquisa dados reais na web (web search da Anthropic) e propoe o bloco `report`
 * (KPIs + insights) validado contra `reportSchema`. Usado pelo "Gerar relatorio".
 */
export async function generateReportDraft(
  ctx: EntityDraftContext,
): Promise<Report> {
  const { anthropic, languageModel } = resolveModel();
  const shape =
    '{"kpis":[{"label":"...","value":"...","kind":"fact","source":"https://fonte-real...","source_label":"...","note":"..."},' +
    '{"label":"...","value":"...","kind":"goal","note":"..."}],' +
    '"insights":[{"text":"...","source":"https://fonte-real...","source_label":"..."}]}';
  const { text } = await generateText({
    model: languageModel,
    maxOutputTokens: 8000,
    tools: {
      web_search: anthropic.tools.webSearch_20250305({ maxUses: 5 }),
    },
    stopWhen: stepCountIs(8),
    system:
      "Voce e um agente de pesquisa do BusinessOS. Pesquise dados de mercado REAIS e atuais " +
      "usando apenas fontes confiaveis (institutos, industria, orgaos oficiais). Cada KPI 'fact' " +
      "precisa de uma URL real e verificavel; KPIs 'goal' sao metas do proprio negocio (sem fonte).",
    prompt:
      "Monte um bloco de relatorio (KPIs + insights) para a entidade a seguir. " +
      "Pesquise na web e ancore cada numero numa fonte real.\n\n" +
      `${contextBlock(ctx)}\n\n` +
      "Ao final, responda APENAS com um objeto JSON valido (sem texto ao redor) no " +
      `formato: ${shape}. Use valores curtos e formatados (ex.: "US$ 4,2 bi").`,
  });
  const validated = reportSchema.parse(extractJson(text));
  return {
    ...validated,
    generated_by: "ai",
    generated_at: new Date().toISOString().slice(0, 10),
  };
}
