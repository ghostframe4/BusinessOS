import "server-only";

import { embedText } from "@/lib/ai/embeddings";
import { RAG_ENABLED } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

import type { KnowledgeMatch } from "./types";

/**
 * Recuperacao de contexto (RAG) — SPEC. Embeda a pergunta (task 'query') e chama
 * a RPC `match_knowledge`, que ordena por distancia de cosseno no pgvector e
 * aplica a RLS (SECURITY INVOKER: so retorna linhas do caller).
 *
 * "Cabo solto": sem `GOOGLE_GENERATIVE_AI_API_KEY` (`RAG_ENABLED` falso) retorna
 * `[]` — o chat segue funcionando, so sem ancoragem na base.
 */

/** Numero default de trechos recuperados. */
const DEFAULT_MATCH_COUNT = 6;

/** Linha crua retornada pela RPC `match_knowledge`. */
interface MatchRow {
  id: string;
  source_type: "entity" | "message";
  source_id: string;
  content: string;
  similarity: number;
}

/**
 * Recupera os `k` trechos mais relevantes para `query`. Retorna `[]` se o RAG
 * estiver desligado ou a query for vazia.
 */
export async function retrieveContext(
  query: string,
  k = DEFAULT_MATCH_COUNT,
): Promise<KnowledgeMatch[]> {
  if (!RAG_ENABLED) return [];
  const text = query.trim();
  if (!text) return [];

  const embedding = await embedText(text, "query");

  const supabase = await createClient();
  // O supabase-js serializa o array de numeros para o tipo `vector` do pgvector.
  // (Se a RPC reclamar do tipo, troque por `JSON.stringify(embedding)`.)
  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding,
    match_count: k,
  });
  if (error) throw error;

  const rows = (data ?? []) as MatchRow[];
  return rows.map((r) => ({
    id: r.id,
    sourceType: r.source_type,
    sourceId: r.source_id,
    content: r.content,
    similarity: r.similarity,
  }));
}
