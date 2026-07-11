import type { ContentStore, RawDoc, WriteDoc } from "./types";

/**
 * STUB documentado da fase FUTURA (docs/04-technical-spec.md §11). NAO usar.
 *
 * O plano Supabase NAO muda o contrato de dominio (camada 3, repository.ts):
 * troca-se apenas a camada 4 implementando `ContentStore` contra uma tabela
 * `content_entities` que espelha o frontmatter + coluna `body`. O conflito
 * otimista vira `update ... where id = $1 and revision = $baseRevision` (0 linhas
 * afetadas => ConflictError); a escrita atomica vira a propria transacao Postgres.
 *
 * Enquanto `CONTENT_STORE !== 'supabase'`, este arquivo existe apenas para fixar a
 * conformidade com a interface. Todos os metodos lancam "not implemented".
 */
const NOT_IMPLEMENTED =
  "SupabaseContentStore: not implemented (fase futura — ver docs/04-technical-spec.md §11). Use CONTENT_STORE=file.";

export class SupabaseContentStore implements ContentStore {
  async read(_id: string): Promise<RawDoc | null> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async list(_section?: string): Promise<RawDoc[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async write(_id: string, _doc: WriteDoc): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async exists(_id: string): Promise<boolean> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
