import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { config } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

import { buildAttachmentPath, isOwnedBy, sanitizeFilename } from "./paths";
import {
  StorageError,
  validateFile,
  type FileCategory,
  type StoredFile,
} from "./types";

/**
 * Helpers de STORAGE server-side (ADR 0001 §7). Usam o cliente Supabase da
 * SESSAO (`lib/supabase/server`), portanto sujeitos a RLS: cada usuario so
 * enxerga/grava sob o proprio prefixo `<userId>/...` no bucket privado.
 *
 * O `userId` e sempre resolvido AQUI dentro (via `auth.getUser()`) e forcado
 * como primeiro segmento do path — nunca confiamos num id vindo do chamador,
 * para que um usuario jamais escreva no prefixo de outro.
 *
 * NENHUMA UI depende disto ainda: sao "cabos soltos" prontos para o futuro
 * botao de upload ligar. Ver exemplo de uso no fim deste arquivo.
 */

const BUCKET = config.SUPABASE_STORAGE_BUCKET;

/** Validade padrao de uma URL assinada de download: 1 hora. */
export const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Resolve o usuario logado ou lanca `StorageError('auth')`. */
async function requireUser(
  supabase: SupabaseClient,
): Promise<{ id: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new StorageError(
      "auth",
      "Nao autenticado: e preciso estar logado para acessar anexos.",
    );
  }
  return { id: user.id };
}

export interface UploadAttachmentOptions {
  /**
   * Nome do arquivo. Obrigatorio quando `file` e um Buffer; para `File` cai em
   * `file.name` se omitido.
   */
  filename?: string;
  /**
   * MIME type. Obrigatorio quando `file` e um Buffer; para `File` cai em
   * `file.type` se omitido.
   */
  contentType?: string;
  /** Escopo de entidade (ex.: "direcao") — organiza o path. */
  section?: string;
  /** Entidade (ex.: "oferta"). Requer `section`. */
  entity?: string;
  /** Sobrescrever se o path ja existir (padrao: false — path e unico por UUID). */
  upsert?: boolean;
}

/**
 * Faz upload de um anexo para o bucket privado, sob `<userId>/...`.
 * Valida tipo (whitelist) e tamanho (<= 25 MB) ANTES de enviar; lanca
 * `StorageError` (kind `type` | `size` | `auth` | `upload`) em pt-BR.
 *
 * Aceita `File` (Server Action / Route Handler recebendo FormData) ou `Buffer`
 * (geracao server-side); para Buffer, `filename` e `contentType` sao obrigatorios.
 */
export async function uploadAttachment(
  file: File | Buffer,
  opts: UploadAttachmentOptions = {},
): Promise<StoredFile> {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  // Normaliza metadados a partir da fonte (File carrega os seus; Buffer nao).
  const isFile = typeof File !== "undefined" && file instanceof File;
  const filename = opts.filename ?? (isFile ? (file as File).name : undefined);
  const contentType =
    opts.contentType ?? (isFile ? (file as File).type || undefined : undefined);
  const size = isFile ? (file as File).size : (file as Buffer).byteLength;

  if (!filename) {
    throw new StorageError(
      "type",
      "Nome do arquivo obrigatorio (informe `filename` ao enviar um Buffer).",
    );
  }

  // Validacao robusta (whitelist + limite). Retorna o tipo canonico.
  const allowed = validateFile({ filename, contentType, size });

  const path = buildAttachmentPath({
    userId: user.id,
    filename,
    section: opts.section,
    entity: opts.entity,
  });

  const body = isFile ? (file as File) : (file as Buffer);
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: allowed.contentType,
    upsert: opts.upsert ?? false,
  });
  if (error) {
    throw new StorageError("upload", `Falha ao enviar o anexo: ${error.message}`);
  }

  return {
    path,
    name: sanitizeFilename(filename),
    size,
    contentType: allowed.contentType,
    category: allowed.category as FileCategory,
  };
}

/**
 * Gera uma URL assinada temporaria para download (o bucket e privado, entao
 * nao ha URL publica). Confere que o `path` pertence ao usuario logado antes
 * de assinar — falha cedo com mensagem clara (a RLS ja garantiria, mas assim
 * o erro e legivel).
 */
export async function getSignedUrl(
  path: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!isOwnedBy(path, user.id)) {
    throw new StorageError(
      "path",
      "Acesso negado: este anexo nao pertence ao usuario logado.",
    );
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) {
    throw new StorageError(
      "path",
      `Nao foi possivel gerar a URL de download: ${error?.message ?? "desconhecido"}.`,
    );
  }
  return data.signedUrl;
}

/** Item retornado por `listAttachments`. */
export interface AttachmentListItem {
  /** Caminho completo no bucket (`<userId>/...`). */
  path: string;
  /** Nome do arquivo (ultimo segmento). */
  name: string;
  /** Tamanho em bytes, se disponivel. */
  size?: number;
  /** MIME, se disponivel nos metadados. */
  contentType?: string;
  /** Data da ultima modificacao (ISO), se disponivel. */
  updatedAt?: string;
}

/**
 * Lista os anexos do usuario logado. `subPrefix` (opcional) restringe a busca
 * dentro do prefixo do usuario, ex.: `"direcao/oferta"` lista
 * `<userId>/direcao/oferta/*`. O prefixo do usuario e sempre prepended — nunca
 * se lista fora dele.
 */
export async function listAttachments(
  subPrefix?: string,
): Promise<AttachmentListItem[]> {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const clean = subPrefix?.replace(/^\/+|\/+$/g, "");
  const prefix = clean ? `${user.id}/${clean}` : user.id;

  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
    limit: 100,
    sortBy: { column: "updated_at", order: "desc" },
  });
  if (error) {
    throw new StorageError("path", `Falha ao listar anexos: ${error.message}`);
  }

  return (data ?? [])
    // `list` inclui "pastas" (sem `id`) — mantemos apenas arquivos reais.
    .filter((obj) => obj.id !== null && obj.name)
    .map((obj) => {
      const meta = (obj.metadata ?? {}) as Record<string, unknown>;
      const size = typeof meta.size === "number" ? meta.size : undefined;
      const mimetype =
        typeof meta.mimetype === "string" ? meta.mimetype : undefined;
      return {
        path: `${prefix}/${obj.name}`,
        name: obj.name,
        size,
        contentType: mimetype,
        updatedAt: obj.updated_at ?? undefined,
      };
    });
}

/**
 * Remove um anexo do usuario logado. Confere a posse do `path` antes (a RLS
 * tambem barraria, mas damos erro claro). Idempotente do ponto de vista do
 * chamador (remover algo inexistente nao lanca).
 */
export async function removeAttachment(path: string): Promise<void> {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!isOwnedBy(path, user.id)) {
    throw new StorageError(
      "path",
      "Acesso negado: este anexo nao pertence ao usuario logado.",
    );
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    throw new StorageError("path", `Falha ao remover o anexo: ${error.message}`);
  }
}

/*
 * EXEMPLO (futuro botao de upload) — apenas ilustrativo, nao e codigo ativo:
 *
 *   // Server Action recebendo FormData de um <form>:
 *   "use server";
 *   export async function anexarArquivo(formData: FormData) {
 *     const file = formData.get("file") as File;
 *     const stored = await uploadAttachment(file, {
 *       section: "direcao",
 *       entity: "oferta",
 *     });
 *     // Guarde `stored.path` (ex.: no frontmatter da entidade) para depois:
 *     const url = await getSignedUrl(stored.path); // link de download temporario
 *     return { path: stored.path, url };
 *   }
 */
