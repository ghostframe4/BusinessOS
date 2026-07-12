import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

import { config, RAG_ENABLED } from "@/lib/config";

/**
 * Embeddings do RAG (SPEC — pagina Principal). Usa o Google
 * `gemini-embedding-001` via `@ai-sdk/google`, com dimensionalidade reduzida a
 * 1536 (para casar com a coluna `vector(1536)` do Postgres/pgvector).
 *
 * Server-only: le a `GOOGLE_GENERATIVE_AI_API_KEY` do `config` validado. "Cabo
 * solto": quando a chave falta, `RAG_ENABLED` e falso e os chamadores nem chegam
 * aqui; ainda assim lancamos erro claro como defesa em profundidade.
 *
 * `taskType` do Google otimiza o vetor para o uso: `RETRIEVAL_DOCUMENT` ao
 * INDEXAR (task 'document') e `RETRIEVAL_QUERY` ao BUSCAR (task 'query').
 */

/** Modelo de embedding. Trocavel por esta constante. */
export const EMBEDDING_MODEL_ID = "gemini-embedding-001";

/** Dimensao do vetor — precisa casar com a coluna `vector(1536)` no banco. */
export const EMBEDDING_DIMS = 1536;

/** Tarefa do embedding: indexar documento vs. consultar. */
export type EmbeddingTask = "document" | "query";

/** Mapeia a task local para o `taskType` do provider Google. */
function taskType(task: EmbeddingTask): "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" {
  return task === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT";
}

/** Resolve o modelo de embedding do Google. Lanca se a chave faltar. */
function resolveEmbeddingModel() {
  if (!RAG_ENABLED) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY ausente: o RAG (embeddings) nao esta configurado.",
    );
  }
  const google = createGoogleGenerativeAI({
    apiKey: config.GOOGLE_GENERATIVE_AI_API_KEY,
  });
  return google.textEmbedding(EMBEDDING_MODEL_ID);
}

/** Monta os `providerOptions` do Google para a task pedida. */
function providerOptions(task: EmbeddingTask) {
  return {
    google: {
      outputDimensionality: EMBEDDING_DIMS,
      taskType: taskType(task),
    },
  } as const;
}

/** Gera o embedding de um unico texto. */
export async function embedText(
  text: string,
  task: EmbeddingTask = "document",
): Promise<number[]> {
  const { embedding } = await embed({
    model: resolveEmbeddingModel(),
    value: text,
    providerOptions: providerOptions(task),
  });
  return embedding;
}

/** Gera embeddings de varios textos numa unica chamada (batch). */
export async function embedTexts(
  texts: string[],
  task: EmbeddingTask = "document",
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { embeddings } = await embedMany({
    model: resolveEmbeddingModel(),
    values: texts,
    providerOptions: providerOptions(task),
  });
  return embeddings;
}
