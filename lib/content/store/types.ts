/**
 * Camada de persistencia — a fronteira dura de troca file <-> supabase.
 * Interface proposital e minima: so persistencia crua, SEM regras de dominio.
 * (docs/04-technical-spec.md §5.)
 */

/** Documento cru como sai do store (frontmatter ainda NAO validado). */
export interface RawDoc {
  /** Frontmatter cru (ainda nao validado pelo schema). */
  data: Record<string, unknown>;
  /** Markdown apos o frontmatter. */
  body: string;
  /** 'content/<section>/<entity>.md' (ou chave equivalente no backend). */
  path: string;
}

/** Payload de escrita: frontmatter + corpo. */
export interface WriteDoc {
  data: Record<string, unknown>;
  body: string;
}

export interface ContentStore {
  /** Le o doc cru pelo id "<section>/<entity>"; null se nao existe. */
  read(id: string): Promise<RawDoc | null>;
  /** Lista docs crus (opcionalmente de uma secao). */
  list(section?: string): Promise<RawDoc[]>;
  /** Persiste (create/overwrite) de forma ATOMICA o doc cru. */
  write(id: string, doc: WriteDoc): Promise<void>;
  /** Existencia rapida (para seeder / criacao). */
  exists(id: string): Promise<boolean>;
}
