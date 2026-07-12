/**
 * Atividade AO VIVO dos agentes (heartbeat efemero para o Workflow).
 *
 * Os CLIs `pnpm agent:read` / `pnpm agent:write` sao a "porta unica" de qualquer
 * operacao de agente sobre `content/`. Cada vez que um roda, deixa aqui um
 * "batimento": qual agente, que acao (read/write) e sobre qual entidade, com o
 * timestamp. O board de Workflow le esses batimentos e mostra em "TRABALHANDO
 * AGORA" quem esta operando no terminal AGORA — sumindo sozinho apos a janela.
 *
 * Design:
 *  - UM arquivo por agente em `.businessos/activity/<slug>.json` (nao um mapa
 *    unico): agentes concorrentes escrevem arquivos diferentes, sem race.
 *  - Escrita ATOMICA (tmp + rename no mesmo dir), espelhando o file-store.
 *  - Best-effort: registrar atividade NUNCA pode quebrar a operacao real do
 *    agente — toda falha e engolida.
 *  - Efemero: nao versionado (ver .gitignore). E estado de runtime, nao conteudo.
 */
import { randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/** Diretorio dos batimentos, relativo ao cwd (raiz do projeto). */
const ACTIVITY_DIR = path.join(process.cwd(), ".businessos", "activity");

/**
 * Janela de "ao vivo": um batimento so conta como atividade atual por este tempo.
 * Como read/write sao instantaneos, o batimento fica valido por ~10s apos rodar
 * o CLI — tempo de o board (polling ~1.5s) captar e exibir antes de sumir.
 */
export const ACTIVITY_WINDOW_MS = 10_000;

/** Acao registrada pelo CLI correspondente. */
export type ActivityAction = "read" | "write";

/** Um batimento persistido (o `slug` vem do nome do arquivo na leitura). */
interface ActivityBeat {
  slug: string;
  action: ActivityAction;
  /** id da entidade ("<section>/<entity>") ou null (ex.: listagem sem --id). */
  entityId: string | null;
  /** epoch ms (Date.now no momento do batimento). */
  ts: number;
}

/** Extrai o slug de um ator `agent:<slug>` (ou `<slug>` cru). `null` se invalido. */
export function actorSlug(actor: string | null | undefined): string | null {
  if (!actor) return null;
  const raw = actor.startsWith("agent:") ? actor.slice("agent:".length) : actor;
  return /^[a-z0-9-]+$/.test(raw) ? raw : null;
}

/**
 * Grava um batimento para `slug`. Best-effort: qualquer erro e engolido para
 * nunca interferir na operacao real do agente. Sem slug valido, e no-op.
 */
export async function recordActivity(input: {
  actor: string | null | undefined;
  action: ActivityAction;
  entityId: string | null;
}): Promise<void> {
  const slug = actorSlug(input.actor);
  if (!slug) return;
  try {
    await mkdir(ACTIVITY_DIR, { recursive: true });
    const beat = {
      action: input.action,
      entityId: input.entityId,
      ts: Date.now(),
    };
    const file = path.join(ACTIVITY_DIR, `${slug}.json`);
    const tmp = path.join(
      ACTIVITY_DIR,
      `.tmp-${randomBytes(6).toString("hex")}-${slug}.json`,
    );
    await writeFile(tmp, `${JSON.stringify(beat)}\n`, "utf8");
    await rename(tmp, file);
  } catch {
    // Heartbeat e best-effort: silencioso de proposito.
  }
}

/**
 * Le os batimentos AINDA dentro da janela ({@link ACTIVITY_WINDOW_MS}).
 * Ignora arquivos temporarios/corrompidos e batimentos expirados. Ordena do mais
 * recente para o mais antigo. Se o diretorio nao existe, retorna vazio.
 */
export async function readActiveActivity(): Promise<ActivityBeat[]> {
  let names: string[];
  try {
    names = await readdir(ACTIVITY_DIR);
  } catch {
    return [];
  }
  const now = Date.now();
  const beats: ActivityBeat[] = [];
  for (const name of names) {
    if (!name.endsWith(".json") || name.startsWith(".tmp-")) continue;
    const slug = name.slice(0, -".json".length);
    if (!/^[a-z0-9-]+$/.test(slug)) continue;
    try {
      const raw = await readFile(path.join(ACTIVITY_DIR, name), "utf8");
      const parsed = JSON.parse(raw) as {
        action?: unknown;
        entityId?: unknown;
        ts?: unknown;
      };
      const ts = typeof parsed.ts === "number" ? parsed.ts : 0;
      if (now - ts >= ACTIVITY_WINDOW_MS) continue; // expirado
      const action = parsed.action === "write" ? "write" : "read";
      const entityId =
        typeof parsed.entityId === "string" ? parsed.entityId : null;
      beats.push({ slug, action, entityId, ts });
    } catch {
      // arquivo em escrita/corrompido: ignora neste ciclo.
    }
  }
  return beats.sort((a, b) => b.ts - a.ts);
}
