import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { embedTexts } from "@/lib/ai/embeddings";
import { createClient } from "@/lib/supabase/server";

/**
 * Indexacao da base de conhecimento (RAG) — SPEC.
 *
 * As funcoes aceitam um `SupabaseClient` explicito + `userId?` opcional, mesmo
 * padrao do `SupabaseContentStore`:
 *  - Com `userId` (cliente service_role / backfill): SETA e FILTRA `user_id`.
 *  - Sem `userId` (cliente de sessao / RLS): confia no default `auth.uid()`.
 *
 * O vetor de embedding e passado como ARRAY JS de numeros; o supabase-js serializa
 * para o tipo `vector` do pgvector. (Se algum insert falhar por tipo, converta
 * para string JSON com `JSON.stringify(embedding)`.)
 */

const CHUNKS = "knowledge_chunks";

/** Tamanho-alvo de cada chunk, em caracteres. */
const DEFAULT_MAX_CHARS = 1000;

/**
 * Quebra um texto em chunks de ~`maxChars`, agrupando paragrafos inteiros
 * (`\n\n`). Um paragrafo maior que `maxChars` vira um chunk sozinho (nao cortamos
 * palavras no meio). Nunca retorna chunk vazio.
 */
export function chunkText(text: string, maxChars = DEFAULT_MAX_CHARS): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (!current) {
      current = para;
    } else if (current.length + 2 + para.length <= maxChars) {
      current = `${current}\n\n${para}`;
    } else {
      chunks.push(current);
      current = para;
    }
  }
  if (current) chunks.push(current);

  // Garante que nenhum chunk vazio escape.
  return chunks.filter((c) => c.trim().length > 0);
}

/** Monta uma linha de insert para `knowledge_chunks`. */
function chunkRow(
  sourceType: "entity" | "message",
  sourceId: string,
  index: number,
  content: string,
  embedding: number[],
  userId?: string,
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    source_type: sourceType,
    source_id: sourceId,
    chunk_index: index,
    content,
    embedding,
  };
  // Sob service_role, seta o tenant manualmente; sob RLS cai no default auth.uid().
  if (userId) row.user_id = userId;
  return row;
}

/**
 * (Re)indexa uma entidade de conteudo. Idempotente: apaga os chunks antigos da
 * entidade e insere os novos. O texto indexado e titulo + resumo + corpo.
 */
export async function indexEntity(
  client: SupabaseClient,
  entityId: string,
  title: string,
  body: string,
  opts?: { userId?: string; summary?: string },
): Promise<void> {
  const userId = opts?.userId;

  // 1) Remove chunks antigos desta entidade (idempotencia).
  let del = client
    .from(CHUNKS)
    .delete()
    .eq("source_type", "entity")
    .eq("source_id", entityId);
  if (userId) del = del.eq("user_id", userId);
  const { error: delErr } = await del;
  if (delErr) throw delErr;

  // 2) Monta o texto e quebra em chunks.
  const text = [title, opts?.summary ?? "", "", body]
    .join("\n")
    .trim();
  const chunks = chunkText(text);
  if (chunks.length === 0) return;

  // 3) Embeddings (task 'document') e insert em lote.
  const vectors = await embedTexts(chunks, "document");
  const rows = chunks.map((content, i) =>
    chunkRow("entity", entityId, i, content, vectors[i], userId),
  );

  const { error: insErr } = await client.from(CHUNKS).insert(rows);
  if (insErr) throw insErr;
}

/**
 * Indexa uma mensagem (do assistant) como um unico chunk. Idempotente por
 * `(source_type='message', source_id=messageId)`.
 */
export async function indexMessage(
  client: SupabaseClient,
  messageId: string,
  content: string,
  opts?: { userId?: string },
): Promise<void> {
  const userId = opts?.userId;
  const text = content.trim();
  if (!text) return;

  // Remove eventual chunk anterior desta mensagem (idempotencia).
  let del = client
    .from(CHUNKS)
    .delete()
    .eq("source_type", "message")
    .eq("source_id", messageId);
  if (userId) del = del.eq("user_id", userId);
  const { error: delErr } = await del;
  if (delErr) throw delErr;

  const [vector] = await embedTexts([text], "document");
  const row = chunkRow("message", messageId, 0, text, vector, userId);

  const { error: insErr } = await client.from(CHUNKS).insert(row);
  if (insErr) throw insErr;
}

/**
 * Wrapper de runtime: indexa uma mensagem do usuario logado usando o cliente de
 * sessao (RLS). Usado no `onFinish` da rota `/api/chat`.
 */
export async function indexMessageForCurrentUser(
  messageId: string,
  content: string,
): Promise<void> {
  const supabase = await createClient();
  await indexMessage(supabase, messageId, content);
}
