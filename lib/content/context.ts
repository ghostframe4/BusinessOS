import { AsyncLocalStorage } from "node:async_hooks";

import type { ContentStore } from "./store/types";

/**
 * Contexto de execucao do dominio de conteudo (ADR 0001 §3).
 *
 * Carrega, por request/processo, o `ContentStore` ja resolvido para o tenant certo
 * e o email do "owner" a usar no seed. Os PONTOS DE ENTRADA (Server Actions, RSC,
 * Route Handlers, CLIs) estabelecem o contexto uma vez via `runWithContext`; o
 * `getStore()` e o `buildSeedFrontmatter` o consomem. Assim as assinaturas de
 * `readEntity`/`writeEntity`/`listEntities` NAO mudam — nenhum call site quebra.
 */
export interface ContentContext {
  /** Store ja escopado ao tenant (RLS por sessao, ou service_role + user_id). */
  store: ContentStore;
  /** Email gravado como `owner` no seed de novas entidades (o dono do tenant). */
  ownerEmail: string;
}

const storage = new AsyncLocalStorage<ContentContext>();

/** Roda `fn` com o contexto de conteudo ativo (store + owner do tenant). */
export function runWithContext<T>(
  ctx: ContentContext,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(ctx, fn);
}

/** Contexto ativo, se houver (undefined fora de um `runWithContext`). */
export function getContext(): ContentContext | undefined {
  return storage.getStore();
}
