import type { SupabaseClient } from "@supabase/supabase-js";

import { ConflictError } from "../errors";
import type { ContentStore, RawDoc, WriteDoc } from "./types";

/**
 * Store Supabase (ADR 0001). Implementa `ContentStore` contra a tabela
 * `content_entities`, que espelha o frontmatter (jsonb) + corpo, uma copia por
 * usuario (PK `(user_id, entity_id)`).
 *
 * Dois modos de operacao:
 *  - **RLS (UI):** `client` autenticado (@supabase/ssr, cookies do usuario) e
 *    `actAsUserId` ausente. O isolamento por tenant e feito pela RLS
 *    (`auth.uid() = user_id`); no INSERT, `user_id` cai no default `auth.uid()`.
 *  - **Admin (CLI/ETL/seed):** `client` service_role + `actAsUserId` explicito.
 *    Contorna a RLS; o codigo filtra/grava `user_id = actAsUserId`.
 *
 * O conflito otimista e ATOMICO no banco: `UPDATE ... WHERE revision = base`
 * (0 linhas afetadas numa linha existente => `ConflictError`) — mesma semantica
 * do rename atomico do file-store.
 */
const TABLE = "content_entities";

interface EntityRow {
  entity_id: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export class SupabaseContentStore implements ContentStore {
  constructor(
    private readonly client: SupabaseClient,
    /** Tenant a agir (modo service_role). Ausente => modo RLS (auth.uid()). */
    private readonly actAsUserId?: string,
  ) {}

  async read(id: string): Promise<RawDoc | null> {
    let query = this.client
      .from(TABLE)
      .select("frontmatter, body")
      .eq("entity_id", id);
    if (this.actAsUserId) query = query.eq("user_id", this.actAsUserId);

    const { data, error } = await query.maybeSingle<EntityRow>();
    if (error) throw error;
    if (!data) return null;
    return { data: data.frontmatter, body: data.body, path: id };
  }

  async list(section?: string): Promise<RawDoc[]> {
    let query = this.client.from(TABLE).select("entity_id, frontmatter, body");
    if (section) query = query.eq("section", section);
    if (this.actAsUserId) query = query.eq("user_id", this.actAsUserId);

    const { data, error } = await query.returns<EntityRow[]>();
    if (error) throw error;
    return (data ?? []).map((r) => ({
      data: r.frontmatter,
      body: r.body,
      path: r.entity_id,
    }));
  }

  async exists(id: string): Promise<boolean> {
    let query = this.client.from(TABLE).select("entity_id").eq("entity_id", id);
    if (this.actAsUserId) query = query.eq("user_id", this.actAsUserId);

    const { data, error } = await query.maybeSingle<{ entity_id: string }>();
    if (error) throw error;
    return Boolean(data);
  }

  async write(id: string, doc: WriteDoc): Promise<void> {
    // O repository ja incrementou: `frontmatter.revision` e o NOVO revision.
    const newRevision = Number(doc.data.revision);
    const baseRevision = newRevision - 1;
    const section = String(doc.data.section);

    // 1. UPDATE condicional (lock otimista atomico) — so afeta a linha se a
    //    revision atual ainda for a base que o repository leu.
    let update = this.client
      .from(TABLE)
      .update({
        frontmatter: doc.data,
        body: doc.body,
        revision: newRevision,
        section,
      })
      .eq("entity_id", id)
      .eq("revision", baseRevision);
    if (this.actAsUserId) update = update.eq("user_id", this.actAsUserId);

    const { data: updated, error: updErr } = await update.select("entity_id");
    if (updErr) throw updErr;
    if (updated && updated.length > 0) return; // sucesso

    // 2. 0 linhas: ou a entidade nao existe (criacao) ou houve conflito real.
    const current = await this.read(id);
    if (current) {
      const currentRevision = Number(current.data.revision);
      throw new ConflictError(
        `Conflito de revisao em ${id}: esperado ${baseRevision}, atual ${currentRevision}.`,
        currentRevision,
      );
    }

    // 3. Criacao: INSERT. No modo admin, o user_id e explicito; no modo RLS,
    //    cai no default auth.uid().
    const insertRow: Record<string, unknown> = {
      entity_id: id,
      section,
      frontmatter: doc.data,
      body: doc.body,
      revision: newRevision,
    };
    if (this.actAsUserId) insertRow.user_id = this.actAsUserId;

    const { error: insErr } = await this.client.from(TABLE).insert(insertRow);
    if (insErr) throw insErr;
  }
}
