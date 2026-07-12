/**
 * CLI de ESCRITA para agentes/skills (docs/05-agent-integration.md).
 *
 * Wrapper FINO sobre `writeEntity` (lib/content/repository.ts): a porta unica que
 * ENFORCA registry, conflito por revision, write_policy, campos de sistema imutaveis
 * e o fluxo `propose -> needs_review`. Agentes NUNCA tocam `content/` por fora; eles
 * chamam este CLI (`pnpm agent:write ...`).
 *
 * Uso:
 *   tsx scripts/agent-write.ts \
 *     --id <section/entity> --editor agent:<slug> --base-revision <n> \
 *     [--status <status>] [--summary "..."] [--tags a,b,c] \
 *     [--set key=value ...] [--body "..." | --body-file <path>]
 *
 * Sucesso: imprime `{ ok:true, id, revision, status, last_edited_by, updated }`, exit 0.
 * Erro:    imprime `{ ok:false, kind, ... }`, exit 1, distinguindo:
 *   conflict (currentRevision) · policy · validation (fieldErrors) ·
 *   not_in_registry · usage · unknown.
 */
import { readFile } from "node:fs/promises";

import { recordActivity } from "@/lib/content/activity";
import {
  ConflictError,
  NotInRegistryError,
  PolicyError,
  ValidationError,
} from "@/lib/content/errors";
import { writeEntity, type WriteInput } from "@/lib/content/repository";
import type { Editor, Frontmatter } from "@/lib/content/schema";
import { withAdminContext } from "@/lib/content/session";

import { resolveAdmin } from "./lib/resolve-admin";

/** Erro de uso do CLI (flags faltando/invalidas) — mapeado para `kind: 'usage'`. */
class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}

interface RawArgs {
  id?: string;
  editor?: string;
  baseRevision?: string;
  status?: string;
  summary?: string;
  tags?: string;
  body?: string;
  bodyFile?: string;
  sets: string[];
}

function parseArgs(argv: string[]): RawArgs {
  const out: RawArgs = { sets: [] };
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
      case "--editor":
        out.editor = takeValue();
        break;
      case "--base-revision":
        out.baseRevision = takeValue();
        break;
      case "--status":
        out.status = takeValue();
        break;
      case "--summary":
        out.summary = takeValue();
        break;
      case "--tags":
        out.tags = takeValue();
        break;
      case "--set":
        out.sets.push(takeValue());
        break;
      case "--body":
        out.body = takeValue();
        break;
      case "--body-file":
        out.bodyFile = takeValue();
        break;
      default:
        throw new UsageError(`Flag desconhecida: ${flag}.`);
    }
  }
  return out;
}

/** Valida o prefixo `agent:` e o slug `^[a-z0-9-]+$`. */
function parseEditor(value: string): Editor {
  if (!value.startsWith("agent:")) {
    throw new UsageError(
      `--editor deve comecar com 'agent:' (recebido: ${value}).`,
    );
  }
  const slug = value.slice("agent:".length);
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new UsageError(
      `Slug de agente invalido em --editor: '${slug}' (esperado ^[a-z0-9-]+$).`,
    );
  }
  return value as Editor;
}

function parseBaseRevision(value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    throw new UsageError(`--base-revision deve ser inteiro (recebido: ${value}).`);
  }
  return n;
}

/** Parse JSON quando possivel (numero/bool/objeto), senao mantem string crua. */
function coerceValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/** Monta o `frontmatterPatch` a partir de --status/--summary/--tags/--set. */
function buildPatch(raw: RawArgs): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (raw.status !== undefined) patch.status = raw.status;
  if (raw.summary !== undefined) patch.summary = raw.summary;
  if (raw.tags !== undefined) {
    patch.tags = raw.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  for (const pair of raw.sets) {
    const eq = pair.indexOf("=");
    if (eq === -1) {
      throw new UsageError(`--set espera key=value (recebido: ${pair}).`);
    }
    const key = pair.slice(0, eq);
    if (key.length === 0) {
      throw new UsageError(`--set com chave vazia (recebido: ${pair}).`);
    }
    patch[key] = coerceValue(pair.slice(eq + 1));
  }
  return patch;
}

/** Resolve o corpo: --body-file (le arquivo) OU --body; ausente => mantem atual. */
async function resolveBody(raw: RawArgs): Promise<string | undefined> {
  if (raw.bodyFile !== undefined && raw.body !== undefined) {
    throw new UsageError("Use --body OU --body-file, nao ambos.");
  }
  if (raw.bodyFile !== undefined) {
    return await readFile(raw.bodyFile, "utf8");
  }
  return raw.body;
}

function print(payload: Record<string, unknown>): void {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

async function main(): Promise<void> {
  const raw = parseArgs(process.argv.slice(2));

  if (!raw.id) throw new UsageError("--id e obrigatorio.");
  if (!raw.editor) throw new UsageError("--editor e obrigatorio.");
  if (raw.baseRevision === undefined) {
    throw new UsageError("--base-revision e obrigatorio.");
  }

  // Capturado apos o guard: preserva o estreitamento de tipo (string) dentro do
  // closure de `withAdminContext`, onde a narrowing de `raw.id` nao sobrevive.
  const entityId = raw.id;
  const editor = parseEditor(raw.editor);
  const baseRevision = parseBaseRevision(raw.baseRevision);
  const body = await resolveBody(raw);
  const patch = buildPatch(raw);

  // Multi-tenant (ADR 0001): sem sessao HTTP, o CLI age como o ADMIN via
  // service_role (`withAdminContext`). No modo `file`, roda local como founder.
  const admin = await resolveAdmin();

  await withAdminContext(admin.userId, admin.email, async () => {
    // Batimento AO VIVO para o Workflow: registra ANTES da escrita para que ate
    // mesmo tentativas que batam em conflito/policy mostrem o agente operando.
    await recordActivity({ actor: editor, action: "write", entityId });

    const input: WriteInput = {
      id: entityId,
      editor,
      baseRevision,
      frontmatterPatch: patch as Partial<Frontmatter>,
      body,
    };

    const doc = await writeEntity(input);
    const { id, revision, status, last_edited_by, updated } = doc.frontmatter;
    print({ ok: true, id, revision, status, last_edited_by, updated });
  });
}

main().catch((err: unknown) => {
  if (err instanceof ConflictError) {
    print({
      ok: false,
      kind: "conflict",
      currentRevision: err.currentRevision,
      message: err.message,
    });
  } else if (err instanceof PolicyError) {
    print({ ok: false, kind: "policy", message: err.message });
  } else if (err instanceof ValidationError) {
    print({
      ok: false,
      kind: "validation",
      fieldErrors: err.fieldErrors ?? {},
      message: err.message,
    });
  } else if (err instanceof NotInRegistryError) {
    print({ ok: false, kind: "not_in_registry", message: err.message });
  } else if (err instanceof UsageError) {
    print({ ok: false, kind: "usage", message: err.message });
  } else {
    print({
      ok: false,
      kind: "unknown",
      message: err instanceof Error ? err.message : String(err),
    });
  }
  process.exit(1);
});
