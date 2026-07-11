/**
 * Seeder de conteudo (docs/04-technical-spec.md §7.3 / docs/02-content-model.md §8.4).
 *
 * Para cada `EntityDef` do REGISTRY, se o arquivo ainda NAO existe, cria
 * `content/<section>/<entity>.md` com:
 *  - frontmatter seed: `status: empty`, `revision: 1`, `last_edited_by: system`,
 *    `owner` = founder, `order`/`ai_context` conforme o registry;
 *  - corpo: `# <title>` seguido dos headings `##` do template da entidade.
 *
 * IDEMPOTENTE: arquivos ja existentes sao preservados (nunca sobrescritos).
 * `editor: 'system'`. Roda com `pnpm seed` (tsx).
 */
import { getExtension } from "@/lib/content/entity-extensions";
import { REGISTRY } from "@/lib/content/registry";
import { buildSeedFrontmatter } from "@/lib/content/repository";
import { frontmatterSchema } from "@/lib/content/schema";
import { getStore } from "@/lib/content/store";
import { renderTemplateBody, templateFor } from "@/lib/content/templates";

async function main(): Promise<void> {
  const store = getStore();
  const timestamp = new Date().toISOString();

  let created = 0;
  let skipped = 0;

  for (const def of REGISTRY) {
    if (await store.exists(def.id)) {
      skipped += 1;
      console.log(`skip    ${def.id} (ja existe)`);
      continue;
    }

    const frontmatter = buildSeedFrontmatter(def, timestamp);
    const body = renderTemplateBody(def.title, templateFor(def.id));

    // Rede de seguranca: valida o seed antes de persistir.
    const parsed = frontmatterSchema
      .and(getExtension(def.id))
      .safeParse(frontmatter);
    if (!parsed.success) {
      console.error(
        `ERRO    ${def.id}: seed invalido -> ${parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; ")}`,
      );
      process.exitCode = 1;
      return;
    }

    await store.write(def.id, {
      data: frontmatter as unknown as Record<string, unknown>,
      body,
    });
    created += 1;
    console.log(`create  ${def.id}`);
  }

  console.log(
    `\nSeed concluido: ${created} criado(s), ${skipped} preservado(s), ` +
      `${REGISTRY.length} entidade(s) no registro.`,
  );
}

main().catch((err) => {
  console.error("Falha no seeder:", err);
  process.exit(1);
});
