"use client";

import { createClient } from "@/lib/supabase/client";

import { buildAttachmentPath } from "./paths";
import {
  StorageError,
  validateFile,
  type FileCategory,
  type StoredFile,
} from "./types";

/**
 * Upload DIRETO do browser via signed upload URL (ADR 0001 §7) — o arquivo NAO
 * passa pelo nosso server. Usa o cliente Supabase do browser (RLS por sessao):
 * o proprio usuario logado cria a URL assinada de upload sob o seu prefixo
 * `<userId>/...` e envia o binario direto ao Storage.
 *
 * "Cabo solto": nenhuma UI usa isto ainda. Para uploads pequenos vindos de
 * FormData, prefira a Server Action com `uploadAttachment` (server.ts). Este
 * caminho brilha em arquivos grandes (ate 25 MB), poupando a banda do server.
 *
 * Valida tipo e tamanho no cliente antes de qualquer round-trip (a RLS + a
 * validacao no consumo continuam sendo a barreira real de seguranca).
 */
export async function uploadAttachmentFromBrowser(
  file: File,
  opts: {
    bucket?: string;
    section?: string;
    entity?: string;
    upsert?: boolean;
  } = {},
): Promise<StoredFile> {
  const bucket = opts.bucket ?? "attachments";

  const allowed = validateFile({
    filename: file.name,
    contentType: file.type || undefined,
    size: file.size,
  });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new StorageError(
      "auth",
      "Nao autenticado: faca login para enviar anexos.",
    );
  }

  const path = buildAttachmentPath({
    userId: user.id,
    filename: file.name,
    section: opts.section,
    entity: opts.entity,
  });

  // 1. Cria a URL assinada de upload (permitida pela RLS do proprio usuario).
  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);
  if (signErr || !signed) {
    throw new StorageError(
      "upload",
      `Nao foi possivel preparar o upload: ${signErr?.message ?? "desconhecido"}.`,
    );
  }

  // 2. Envia o binario direto ao Storage usando o token assinado.
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, signed.token, file, {
      contentType: allowed.contentType,
      upsert: opts.upsert ?? false,
    });
  if (upErr) {
    throw new StorageError("upload", `Falha ao enviar o anexo: ${upErr.message}`);
  }

  return {
    path,
    name: path.split("/").pop() ?? file.name,
    size: file.size,
    contentType: allowed.contentType,
    category: allowed.category as FileCategory,
  };
}
