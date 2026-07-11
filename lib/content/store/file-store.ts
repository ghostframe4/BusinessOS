import { randomBytes } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import { parseEntity, stringifyEntity } from "../serialize";
import { sectionEnum } from "../schema";
import type { ContentStore, RawDoc, WriteDoc } from "./types";

const ENTITY_RE = /^[a-z0-9-]+$/;
const SECTIONS = sectionEnum.options as readonly string[];

/**
 * Store default: arquivos MD em `<CONTENT_ROOT>/<section>/<entity>.md`
 * (docs/04-technical-spec.md §5.1). Regras:
 *  - resolucao de caminho segura (anti path-traversal);
 *  - normaliza CRLF -> LF na leitura (Windows-safe);
 *  - escrita ATOMICA: grava em `.tmp-<rand>` no mesmo diretorio e faz rename.
 */
export class FileContentStore implements ContentStore {
  private readonly root: string;

  constructor(root: string) {
    this.root = root;
  }

  /** Valida o id e devolve { section, entity }; rejeita path traversal. */
  private safeParts(id: string): { section: string; entity: string } {
    if (
      typeof id !== "string" ||
      id.includes("\\") ||
      id.includes("..") ||
      id.includes("\0")
    ) {
      throw new Error(`id invalido (path traversal): ${String(id)}`);
    }
    const parts = id.split("/");
    if (parts.length !== 2) {
      throw new Error(`id invalido (esperado "<section>/<entity>"): ${id}`);
    }
    const [section, entity] = parts;
    if (!SECTIONS.includes(section)) {
      throw new Error(`secao invalida: ${section}`);
    }
    if (!ENTITY_RE.test(entity)) {
      throw new Error(`entidade invalida: ${entity}`);
    }
    return { section, entity };
  }

  /** Caminho absoluto/relativo no filesystem. */
  private fileFor(id: string): string {
    const { section, entity } = this.safeParts(id);
    return path.join(this.root, section, `${entity}.md`);
  }

  /** Caminho canonico (forward slashes) exposto em RawDoc.path. */
  private relPath(id: string): string {
    const { section, entity } = this.safeParts(id);
    return `${this.root}/${section}/${entity}.md`.replace(/\\/g, "/");
  }

  async read(id: string): Promise<RawDoc | null> {
    const file = this.fileFor(id);
    let raw: string;
    try {
      raw = await readFile(file, "utf8");
    } catch (e: unknown) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
    const { data, body } = parseEntity(raw);
    return { data, body, path: this.relPath(id) };
  }

  async list(section?: string): Promise<RawDoc[]> {
    const sections = section ? [section] : [...SECTIONS];
    const out: RawDoc[] = [];
    for (const s of sections) {
      if (!SECTIONS.includes(s)) continue;
      const dir = path.join(this.root, s);
      let names: string[];
      try {
        names = await readdir(dir);
      } catch (e: unknown) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw e;
      }
      for (const name of names) {
        if (!name.endsWith(".md")) continue;
        const entity = name.slice(0, -3);
        if (!ENTITY_RE.test(entity)) continue;
        const doc = await this.read(`${s}/${entity}`);
        if (doc) out.push(doc);
      }
    }
    return out;
  }

  async exists(id: string): Promise<boolean> {
    try {
      await stat(this.fileFor(id));
      return true;
    } catch {
      return false;
    }
  }

  async write(id: string, doc: WriteDoc): Promise<void> {
    const { section } = this.safeParts(id);
    const dir = path.join(this.root, section);
    await mkdir(dir, { recursive: true });

    const file = this.fileFor(id);
    const content = stringifyEntity(doc.data, doc.body);

    // Escrita atomica: temporario no MESMO diretorio + rename por cima.
    const tmp = path.join(
      dir,
      `.${path.basename(file)}.tmp-${randomBytes(6).toString("hex")}`,
    );
    await writeFile(tmp, content, "utf8");
    await rename(tmp, file);
  }
}
