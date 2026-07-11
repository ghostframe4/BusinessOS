import { config } from "@/lib/config";

import { FileContentStore } from "./file-store";
import type { ContentStore } from "./types";

/**
 * Selecao do store por `config.CONTENT_STORE` (docs/04 §5.2).
 * Hoje sempre 'file'. O adapter 'supabase' e fase futura (store/supabase-store.ts,
 * stub documentado) e nao esta ligado aqui.
 */
let store: ContentStore | null = null;

export function getStore(): ContentStore {
  if (store) return store;
  switch (config.CONTENT_STORE) {
    case "file":
      store = new FileContentStore(config.CONTENT_ROOT);
      break;
    case "supabase":
      // Fase futura — ver lib/content/store/supabase-store.ts e docs/04 §11.
      throw new Error(
        "CONTENT_STORE=supabase ainda nao implementado (fase futura — ver docs/04 §11).",
      );
    default:
      throw new Error(`CONTENT_STORE invalido: ${String(config.CONTENT_STORE)}`);
  }
  return store;
}

/** Reseta o singleton (util para testes que trocam CONTENT_ROOT). */
export function resetStore(): void {
  store = null;
}
