/**
 * Convencao de caminhos do bucket `attachments` (ADR 0001 §7).
 *
 * REGRA DE OURO (casa com as policies RLS do Storage): o PRIMEIRO segmento do
 * caminho e SEMPRE o `user_id` do dono. As policies do bucket exigem
 * `(storage.foldername(name))[1] = auth.uid()::text`, ou seja, um usuario so
 * pode ler/gravar sob o proprio prefixo `<userId>/...`. Nunca monte um caminho
 * cujo primeiro segmento nao seja o uid do dono.
 *
 * Layout canonico:
 *   - Escopo de entidade:  `<userId>/<section>/<entity>/<uuid>-<arquivo>`
 *   - Escopo livre:        `<userId>/<uuid>-<arquivo>`
 * O prefixo `<uuid>-` garante unicidade (dois uploads do mesmo nome coexistem)
 * sem depender de upsert.
 *
 * Isomorfico (sem imports server-only): usado no server e no browser.
 */

/** Faixa de diacriticos combinantes (Unicode) removida na sanitizacao. */
const DIACRITICS = /[̀-ͯ]/g;

/** UUID v4 via Web Crypto (disponivel em Node 20+ e no browser). */
function uuid(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Sanitiza um nome de arquivo para uso seguro em um caminho de storage:
 *  - separa e preserva a extensao;
 *  - remove diacriticos (acentos) e baixa a caixa;
 *  - troca tudo que nao for [a-z0-9._-] por hifen;
 *  - colapsa hifens/pontos repetidos e apara as bordas;
 *  - remove componentes de traversal ("..") e barras.
 * Nunca retorna vazio (cai em "arquivo" + extensao).
 */
export function sanitizeFilename(filename: string): string {
  const raw = filename.split(/[\\/]/).pop() ?? filename; // descarta diretorios
  const dot = raw.lastIndexOf(".");
  const hasExt = dot > 0 && dot < raw.length - 1;
  const base = hasExt ? raw.slice(0, dot) : raw;
  const ext = hasExt ? raw.slice(dot + 1) : "";

  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(DIACRITICS, "")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "");

  const safeBase = clean(base) || "arquivo";
  const safeExt = clean(ext).replace(/[^a-z0-9]/g, "");
  return safeExt ? `${safeBase}.${safeExt}` : safeBase;
}

/** Componente de path seguro (section/entity): so [a-z0-9-] e "/". */
function sanitizeSegment(segment: string): string {
  return segment
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9/-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
}

export interface BuildPathOptions {
  /** Dono do arquivo — SEMPRE o primeiro segmento (casa com a RLS). */
  userId: string;
  /** Nome de arquivo original (sera sanitizado). */
  filename: string;
  /** Secao da entidade (ex.: "direcao"), opcional. */
  section?: string;
  /** Entidade (ex.: "oferta"), opcional. Requer `section` para ter efeito. */
  entity?: string;
  /**
   * Se `true` (padrao), prefixa o arquivo com um UUID para garantir unicidade.
   * Passe `false` apenas se voce mesmo garante nomes unicos.
   */
  unique?: boolean;
}

/**
 * Monta o caminho canonico `<userId>/[<section>/<entity>/]<uuid>-<arquivo>`.
 * Lanca se `userId` estiver ausente (nunca gera path sem dono).
 */
export function buildAttachmentPath(opts: BuildPathOptions): string {
  const userId = opts.userId?.trim();
  if (!userId) {
    throw new Error("buildAttachmentPath: userId obrigatorio (dono do arquivo).");
  }

  const filename = sanitizeFilename(opts.filename);
  const named = opts.unique === false ? filename : `${uuid()}-${filename}`;

  const parts = [userId];
  if (opts.section) {
    const section = sanitizeSegment(opts.section);
    if (section) parts.push(section);
    if (opts.entity) {
      const entity = sanitizeSegment(opts.entity);
      if (entity) parts.push(entity);
    }
  }
  parts.push(named);
  return parts.join("/");
}

/** O primeiro segmento (dono) de um caminho de storage. */
export function ownerOfPath(path: string): string {
  return path.split("/")[0] ?? "";
}

/**
 * Verifica se `path` pertence a `userId` (primeiro segmento). Espelha, no
 * codigo, a mesma checagem que a RLS faz no banco — para falhar cedo e com
 * mensagem clara, em vez de deixar o Storage retornar um 403 opaco.
 */
export function isOwnedBy(path: string, userId: string): boolean {
  return Boolean(userId) && ownerOfPath(path) === userId;
}
