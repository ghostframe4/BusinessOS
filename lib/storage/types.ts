/**
 * Tipos, limites e validacao de anexos do BusinessOS (ADR 0001 §7 — Storage).
 *
 * Isomorfico (sem imports server-only): pode ser usado tanto no server
 * (`lib/storage/server.ts`) quanto no browser (`lib/storage/client-upload.ts`)
 * para validar arquivos ANTES do upload e para inferir tipo/categoria.
 *
 * O bucket `attachments` e PRIVADO; o download so acontece via URL assinada.
 */

/** Categorias de anexo aceitas. */
export type FileCategory = "image" | "document" | "text" | "office";

/** Descreve um tipo de arquivo permitido (MIME canonico + extensoes). */
export interface AllowedType {
  category: FileCategory;
  /** MIME canonico (o que gravamos como contentType no storage). */
  contentType: string;
  /** Extensoes aceitas, com ponto. A primeira e a canonica. */
  extensions: string[];
}

/**
 * Limite de tamanho por arquivo. Configuravel aqui (nao ha var de ambiente para
 * isto por ora). 25 MB cobre bem imagens, PDFs e documentos do Word.
 */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** Rotulo legivel do limite, para mensagens de erro em pt-BR. */
export const MAX_FILE_SIZE_LABEL = "25 MB";

/**
 * Whitelist de tipos aceitos. Rejeitamos qualquer coisa fora desta lista.
 * - image:    png, jpeg, webp, gif
 * - document: pdf
 * - text:     txt, markdown
 * - office:   doc, docx
 */
export const ALLOWED_TYPES: readonly AllowedType[] = [
  // Imagens
  { category: "image", contentType: "image/png", extensions: [".png"] },
  { category: "image", contentType: "image/jpeg", extensions: [".jpg", ".jpeg"] },
  { category: "image", contentType: "image/webp", extensions: [".webp"] },
  { category: "image", contentType: "image/gif", extensions: [".gif"] },
  // Documentos
  { category: "document", contentType: "application/pdf", extensions: [".pdf"] },
  // Texto
  { category: "text", contentType: "text/plain", extensions: [".txt"] },
  { category: "text", contentType: "text/markdown", extensions: [".md", ".markdown"] },
  // Office (Word)
  { category: "office", contentType: "application/msword", extensions: [".doc"] },
  {
    category: "office",
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: [".docx"],
  },
];

/** Todos os MIME types aceitos (util para `accept` de um futuro <input>). */
export const ALLOWED_CONTENT_TYPES: readonly string[] = ALLOWED_TYPES.map(
  (t) => t.contentType,
);

/** Todas as extensoes aceitas (com ponto). */
export const ALLOWED_EXTENSIONS: readonly string[] = ALLOWED_TYPES.flatMap(
  (t) => t.extensions,
);

/**
 * Um arquivo ja armazenado no bucket. `url` e opcional pois o bucket e privado:
 * a URL assinada e gerada sob demanda por `getSignedUrl` (nao fica embutida).
 */
export interface StoredFile {
  /** Caminho canonico no bucket, ex.: `<userId>/direcao/oferta/<uuid>-plano.pdf`. */
  path: string;
  /** Nome de arquivo (ja sanitizado). */
  name: string;
  /** Tamanho em bytes. */
  size: number;
  /** MIME canonico gravado no storage. */
  contentType: string;
  /** Categoria resolvida. */
  category: FileCategory;
  /** URL assinada temporaria (preenchida sob demanda; ausente por padrao). */
  url?: string;
}

/** Erro de validacao/operacao de storage — mensagem sempre em pt-BR. */
export class StorageError extends Error {
  /** Discriminador para o chamador mapear a resposta (422/403/500). */
  readonly kind: "type" | "size" | "auth" | "path" | "upload";
  constructor(kind: StorageError["kind"], message: string) {
    super(message);
    this.name = "StorageError";
    this.kind = kind;
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/** Extrai a extensao (com ponto, minuscula) de um nome de arquivo, ou "". */
export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0 || dot === filename.length - 1) return "";
  return filename.slice(dot).toLowerCase();
}

function findByContentType(contentType: string): AllowedType | undefined {
  const ct = contentType.toLowerCase().split(";")[0].trim();
  return ALLOWED_TYPES.find((t) => t.contentType === ct);
}

function findByExtension(ext: string): AllowedType | undefined {
  const e = ext.toLowerCase();
  return ALLOWED_TYPES.find((t) => t.extensions.includes(e));
}

/**
 * Resolve o `AllowedType` de um arquivo a partir do MIME e/ou do nome, ou lanca
 * `StorageError('type')` com mensagem clara. Regras:
 *  - Se ha `contentType`, ele deve estar na whitelist.
 *  - Se ha `filename`, sua extensao deve estar na whitelist.
 *  - Se ambos existem, precisam apontar para a MESMA categoria (evita
 *    spoofing de extensao/MIME).
 *  - Precisa de pelo menos um dos dois para decidir.
 */
export function resolveAllowedType(input: {
  contentType?: string;
  filename?: string;
}): AllowedType {
  const byCt = input.contentType ? findByContentType(input.contentType) : undefined;
  const ext = input.filename ? extensionOf(input.filename) : "";
  const byExt = ext ? findByExtension(ext) : undefined;

  if (input.contentType && !byCt) {
    throw new StorageError(
      "type",
      `Tipo de arquivo nao permitido: "${input.contentType}". Aceitos: imagens (PNG, JPEG, WEBP, GIF), PDF, TXT/Markdown e Word (DOC, DOCX).`,
    );
  }
  if (input.filename && ext && !byExt) {
    throw new StorageError(
      "type",
      `Extensao de arquivo nao permitida: "${ext || "(sem extensao)"}". Aceitas: ${ALLOWED_EXTENSIONS.join(", ")}.`,
    );
  }
  if (byCt && byExt && byCt.category !== byExt.category) {
    throw new StorageError(
      "type",
      `Conflito entre o tipo declarado (${input.contentType}) e a extensao (${ext}) do arquivo.`,
    );
  }

  const resolved = byCt ?? byExt;
  if (!resolved) {
    throw new StorageError(
      "type",
      "Nao foi possivel determinar o tipo do arquivo (informe um nome com extensao ou o content-type).",
    );
  }
  return resolved;
}

/** Valida o tamanho, ou lanca `StorageError('size')`. */
export function assertValidSize(size: number): void {
  if (!Number.isFinite(size) || size <= 0) {
    throw new StorageError("size", "Arquivo vazio ou com tamanho invalido.");
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    const mb = (size / (1024 * 1024)).toFixed(1);
    throw new StorageError(
      "size",
      `Arquivo muito grande (${mb} MB). O limite e ${MAX_FILE_SIZE_LABEL}.`,
    );
  }
}

/**
 * Validacao completa (tipo + tamanho). Retorna o `AllowedType` resolvido para o
 * chamador reusar o `contentType` canonico. Lanca `StorageError` em pt-BR.
 */
export function validateFile(input: {
  contentType?: string;
  filename?: string;
  size: number;
}): AllowedType {
  const type = resolveAllowedType(input);
  assertValidSize(input.size);
  return type;
}
