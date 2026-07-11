/**
 * CLI de LEITURA para agentes/skills (docs/05-agent-integration.md).
 *
 * Wrapper FINO sobre `readEntity` / `listEntities` (lib/content/repository.ts).
 * O agente usa este CLI para pegar o `baseRevision` (campo `revision`), o `status`
 * e o `ai_context` (purpose/related/write_policy) ANTES de propor uma escrita via
 * `pnpm agent:write`.
 *
 * Uso:
 *   tsx scripts/agent-read.ts --id <section/entity>   # imprime { frontmatter, body }
 *   tsx scripts/agent-read.ts --section <s>            # lista EntityMeta da secao
 *   tsx scripts/agent-read.ts                          # lista EntityMeta de todas
 *
 * Sucesso: imprime JSON e exit 0.
 * Erro:    imprime `{ ok:false, kind, ... }`, exit 1 (not_in_registry · validation ·
 *          usage · unknown).
 */
import {
  NotInRegistryError,
  ValidationError,
} from "@/lib/content/errors";
import { listEntities, readEntity } from "@/lib/content/repository";
import type { Section } from "@/lib/content/schema";

/** Erro de uso do CLI (flags faltando/invalidas) — mapeado para `kind: 'usage'`. */
class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

const SECTIONS: readonly Section[] = [
  "founder",
  "direcao",
  "validacao",
  "caixa",
];

interface RawArgs {
  id?: string;
  section?: string;
}

function parseArgs(argv: string[]): RawArgs {
  const out: RawArgs = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const takeValue = (): string => {
      const value = argv[i + 1];
      if (value === undefined) throw new UsageError(`Faltou valor para ${flag}.`);
      i++;
      return value;
    };
    switch (flag) {
      case "--id":
        out.id = takeValue();
        break;
      case "--section":
        out.section = takeValue();
        break;
      default:
        throw new UsageError(`Flag desconhecida: ${flag}.`);
    }
  }
  return out;
}

function parseSection(value: string): Section {
  if ((SECTIONS as readonly string[]).includes(value)) return value as Section;
  throw new UsageError(
    `--section invalida: '${value}' (use ${SECTIONS.join("|")}).`,
  );
}

function print(payload: unknown): void {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

async function main(): Promise<void> {
  const raw = parseArgs(process.argv.slice(2));

  if (raw.id) {
    if (raw.section !== undefined) {
      throw new UsageError("Use --id OU --section, nao ambos.");
    }
    const doc = await readEntity(raw.id);
    print({ frontmatter: doc.frontmatter, body: doc.body });
    return;
  }

  const section = raw.section !== undefined ? parseSection(raw.section) : undefined;
  const metas = await listEntities(section);
  print(metas);
}

main().catch((err: unknown) => {
  const fail = (payload: Record<string, unknown>): void => {
    process.stdout.write(`${JSON.stringify({ ok: false, ...payload })}\n`);
  };
  if (err instanceof NotInRegistryError) {
    fail({ kind: "not_in_registry", message: err.message });
  } else if (err instanceof ValidationError) {
    fail({
      kind: "validation",
      fieldErrors: err.fieldErrors ?? {},
      message: err.message,
    });
  } else if (err instanceof UsageError) {
    fail({ kind: "usage", message: err.message });
  } else {
    fail({
      kind: "unknown",
      message: err instanceof Error ? err.message : String(err),
    });
  }
  process.exit(1);
});
