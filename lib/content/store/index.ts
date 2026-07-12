import { config } from "@/lib/config";

import { getContext } from "../context";
import { FileContentStore } from "./file-store";
import type { ContentStore } from "./types";

/**
 * Resolucao do store (ADR 0001 §3).
 *
 * - Se ha um CONTEXTO ativo (`runWithContext` via withUserContext/withAdminContext),
 *   usa o store ja escopado ao tenant. E o caminho de producao (Supabase).
 * - Sem contexto, so o modo `file` tem um store global valido (dev/testes/seed
 *   local, retrocompat total). No modo `supabase` sem contexto, e erro explicito
 *   — persistencia multi-tenant exige saber de quem sao os dados.
 */
let fileStore: FileContentStore | null = null;

export function getStore(): ContentStore {
  const ctx = getContext();
  if (ctx) return ctx.store;

  if (config.CONTENT_STORE === "file") {
    if (!fileStore) fileStore = new FileContentStore(config.CONTENT_ROOT);
    return fileStore;
  }

  throw new Error(
    "CONTENT_STORE=supabase exige um contexto de execucao (withUserContext / " +
      "withAdminContext / runWithContext). Nenhum contexto ativo — os pontos de " +
      "entrada (Server Actions, RSC, Route Handlers, CLIs) devem estabelece-lo.",
  );
}

/** Reseta o singleton do file-store (util para testes que trocam CONTENT_ROOT). */
export function resetStore(): void {
  fileStore = null;
}
