/**
 * Validador de conteudo (docs/04-technical-spec.md §7.3 / docs/02-content-model.md §13).
 *
 * Le TODOS os arquivos Markdown sob `content/` e valida cada um contra o schema de
 * frontmatter (`frontmatterSchema` + extensao por-tipo). Verifica ainda as
 * invariantes estruturais:
 *   - `id` presente e igual a `<section>/<entity>` derivado do caminho;
 *   - `id` pertence ao REGISTRY canonico;
 *   - todo `EntityDef` do REGISTRY tem um arquivo correspondente (sem card orfao).
 *
 * Sai com codigo 1 se qualquer arquivo for invalido/divergente; 0 se tudo valido.
 * Roda no CI com `pnpm content:check` (metrica "frontmatter valido = 100%").
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { config } from "@/lib/config";
import { getExtension } from "@/lib/content/entity-extensions";
import { getEntityDef, REGISTRY } from "@/lib/content/registry";
import { frontmatterSchema } from "@/lib/content/schema";
import { parseEntity } from "@/lib/content/serialize";

const ROOT = config.CONTENT_ROOT;

/** Caminho relativo (com barras normais) de um arquivo em relacao a ROOT. */
function toId(absFile: string): string {
  const rel = path.relative(ROOT, absFile).replace(/\\/g, "/");
  return rel.replace(/\.md$/, "");
}

/** Coleta recursivamente todos os `.md` sob `dir`. */
async function collectMarkdown(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdown(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

async function main(): Promise<void> {
  const files = await collectMarkdown(ROOT);
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const idFromPath = toId(file);
    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch (e) {
      errors.push(`${idFromPath}: falha ao ler (${String(e)})`);
      continue;
    }

    let data: Record<string, unknown>;
    try {
      ({ data } = parseEntity(raw));
    } catch (e) {
      errors.push(`${idFromPath}: frontmatter YAML invalido (${String(e)})`);
      continue;
    }

    // id presente e coerente com o caminho.
    const declaredId = typeof data.id === "string" ? data.id : undefined;
    if (!declaredId) {
      errors.push(`${idFromPath}: campo 'id' ausente ou nao-string.`);
      continue;
    }
    if (declaredId !== idFromPath) {
      errors.push(
        `${idFromPath}: 'id' (${declaredId}) diverge do caminho do arquivo.`,
      );
    }
    seenIds.add(declaredId);

    // id no REGISTRY.
    if (!getEntityDef(declaredId)) {
      errors.push(`${idFromPath}: 'id' fora do REGISTRY canonico.`);
      // ainda validamos o schema base abaixo (extensao vazia).
    }

    // Validacao de schema (base + extensao por-tipo).
    const result = frontmatterSchema
      .and(getExtension(declaredId))
      .safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path.map(String).join(".") || "(root)";
        errors.push(`${idFromPath}: ${key}: ${issue.message}`);
      }
      continue;
    }

    console.log(`ok      ${declaredId}`);
  }

  // Completude: todo EntityDef do REGISTRY tem arquivo.
  for (const def of REGISTRY) {
    if (!seenIds.has(def.id)) {
      errors.push(`${def.id}: arquivo ausente (esperado pelo REGISTRY).`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} problema(s) de conteudo:`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error(
      "\nValidacao de conteudo FALHOU (frontmatter valido != 100%).",
    );
    process.exit(1);
  }

  console.log(
    `\nValidacao OK: ${files.length} arquivo(s), ` +
      `${REGISTRY.length} entidade(s) do registro presentes e validas.`,
  );
}

main().catch((err) => {
  console.error("Falha no validador:", err);
  process.exit(1);
});
