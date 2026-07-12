/**
 * ETL de migracao: leva o conteudo REAL de hoje (arquivos `content/**\/*.md`) para
 * o Postgres/Supabase, sob o usuario ADMIN (o founder). Roda com `tsx`
 * (`pnpm migrate:supabase`). Ver ADR 0001 §5.
 *
 * Caracteristicas:
 *  - Le o disco DIRETO via `FileContentStore(config.CONTENT_ROOT)`, iterando o
 *    REGISTRY — independente do `CONTENT_STORE` atual (a app pode seguir em `file`
 *    enquanto empurramos os dados para o banco).
 *  - Grava por UPSERT DIRETO em `content_entities` via `createAdminClient()`
 *    (service_role, contorna a RLS), NAO via `writeEntity`. Motivo: queremos um
 *    espelho 1:1 do estado atual — `writeEntity` incrementaria `revision` e forcaria
 *    `status: needs_review` (fluxo de proposta), corrompendo a fidelidade.
 *  - Preserva fielmente o frontmatter (revision, created, updated, status, campos
 *    por-tipo) e o corpo. Valida com o schema (base + extensao) como rede de seguranca.
 *  - Idempotente: PK composta `(user_id, entity_id)` + `onConflict` => re-rodar nao
 *    duplica, apenas re-espelha.
 *  - Decisao sobre `owner`: sobrescrevemos `frontmatter.owner` com o e-mail do admin
 *    para que a copia migrada pertenca ao tenant admin. Como o admin E o founder,
 *    isso e, na pratica, um no-op — mas deixa a posse explicita e correta.
 *
 * NAO roda em modo file por si so: precisa do `user_id` (uuid) real do admin, que
 * so existe no Supabase. Resolvemos o admin SEMPRE contra o banco
 * (`resolveSupabaseAdmin`), independente do `CONTENT_STORE`.
 */
import { config } from "@/lib/config";
import { getExtension } from "@/lib/content/entity-extensions";
import { REGISTRY } from "@/lib/content/registry";
import { frontmatterSchema, type Frontmatter } from "@/lib/content/schema";
import { FileContentStore } from "@/lib/content/store/file-store";
import { createAdminClient } from "@/lib/supabase/admin";

import { resolveSupabaseAdmin } from "./lib/resolve-admin";

const TABLE = "content_entities";

interface EntityUpsertRow {
  user_id: string;
  entity_id: string;
  section: string;
  frontmatter: Record<string, unknown>;
  body: string;
  revision: number;
  created: string;
  updated: string;
}

async function main(): Promise<void> {
  const admin = await resolveSupabaseAdmin();
  const supabase = createAdminClient();
  const store = new FileContentStore(config.CONTENT_ROOT);

  console.log(
    `ETL content/ -> Supabase (${TABLE})\n` +
      `Admin alvo: ${admin.email} (${admin.userId})\n`,
  );

  const rows: EntityUpsertRow[] = [];
  const migrated: string[] = [];
  const missing: string[] = [];

  for (const def of REGISTRY) {
    const raw = await store.read(def.id);
    if (!raw) {
      missing.push(def.id);
      console.log(`skip    ${def.id} (arquivo ausente no disco)`);
      continue;
    }

    // Espelha o frontmatter, ajustando o owner para o admin (posse explicita).
    const candidate: Record<string, unknown> = { ...raw.data, owner: admin.email };

    // Rede de seguranca: valida antes de gravar (base + extensao por-tipo).
    const parsed = frontmatterSchema.and(getExtension(def.id)).safeParse(candidate);
    if (!parsed.success) {
      console.error(
        `ERRO    ${def.id}: frontmatter invalido -> ${parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; ")}`,
      );
      process.exitCode = 1;
      return;
    }

    const fm = parsed.data as unknown as Frontmatter;
    rows.push({
      user_id: admin.userId,
      entity_id: fm.id,
      section: fm.section,
      frontmatter: fm as unknown as Record<string, unknown>,
      body: raw.body,
      revision: fm.revision,
      created: fm.created,
      updated: fm.updated,
    });
    migrated.push(fm.id);
  }

  if (rows.length === 0) {
    console.log("\nNada a migrar: nenhum arquivo encontrado no disco.");
    return;
  }

  const { error } = await supabase
    .from(TABLE)
    .upsert(rows, { onConflict: "user_id,entity_id" });
  if (error) throw error;

  console.log(
    `\nMigracao concluida: ${migrated.length} entidade(s) espelhada(s) para ` +
      `${admin.email} (${admin.userId}).`,
  );
  for (const id of migrated) console.log(`  ok    ${id}`);
  if (missing.length > 0) {
    console.log(
      `\n${missing.length} entidade(s) do registro sem arquivo no disco (puladas): ` +
        missing.join(", "),
    );
  }
}

main().catch((err) => {
  console.error("Falha no ETL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
