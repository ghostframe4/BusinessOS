/**
 * Backfill da base de conhecimento (RAG) — SPEC.
 *
 * Le TODAS as entidades de conteudo do admin (founder) em `content_entities` e
 * (re)indexa cada uma em `knowledge_chunks` com embeddings. Idempotente:
 * `indexEntity` faz delete+insert por fonte, entao rodar de novo apenas atualiza.
 *
 * Roda via `tsx` (Node puro, SEM sessao HTTP): resolve o admin (`resolveAdmin`) e
 * usa o cliente service_role (`createAdminClient`), setando `user_id` manualmente
 * (contorna a RLS). Exige `CONTENT_STORE=supabase` e `GOOGLE_GENERATIVE_AI_API_KEY`.
 *
 * Uso:
 *   tsx --env-file-if-exists=.env.local --conditions=react-server scripts/index-knowledge.ts
 */
import { indexEntity } from "@/lib/knowledge/indexing";
import { config, RAG_ENABLED } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

import { resolveAdmin } from "./lib/resolve-admin";

/** Frontmatter minimo que o backfill consome. */
interface EntityFrontmatter {
  title?: string;
  summary?: string;
  [key: string]: unknown;
}

/** Linha crua de `content_entities`. */
interface ContentEntityRow {
  entity_id: string;
  frontmatter: EntityFrontmatter;
  body: string | null;
}

async function main(): Promise<void> {
  if (config.CONTENT_STORE !== "supabase") {
    throw new Error(
      "O backfill exige CONTENT_STORE=supabase (as entidades vivem em content_entities).",
    );
  }
  if (!RAG_ENABLED) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY ausente: o RAG (embeddings) nao esta configurado.",
    );
  }

  const admin = await resolveAdmin();
  if (!admin.userId) {
    throw new Error(
      "Nao foi possivel resolver o user_id do admin (founder). Cadastre o founder primeiro.",
    );
  }

  const client = createAdminClient();

  console.log(`[index-knowledge] admin=${admin.email} (${admin.userId})`);

  const { data, error } = await client
    .from("content_entities")
    .select("entity_id, frontmatter, body")
    .eq("user_id", admin.userId)
    .returns<ContentEntityRow[]>();
  if (error) throw error;

  const rows = data ?? [];
  console.log(`[index-knowledge] ${rows.length} entidade(s) para indexar.`);

  let ok = 0;
  for (const row of rows) {
    const title = row.frontmatter?.title ?? row.entity_id;
    const summary = row.frontmatter?.summary;
    try {
      await indexEntity(client, row.entity_id, title, row.body ?? "", {
        userId: admin.userId,
        summary,
      });
      ok++;
      console.log(`[index-knowledge] ok  ${row.entity_id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[index-knowledge] ERRO ${row.entity_id}: ${msg}`);
    }
  }

  console.log(`[index-knowledge] concluido: ${ok}/${rows.length} indexadas.`);
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[index-knowledge] falhou: ${msg}`);
  process.exit(1);
});
