"use server";

import { revalidatePath } from "next/cache";

import {
  ConflictError,
  PolicyError,
  ValidationError,
} from "@/lib/content/errors";
import { writeEntity } from "@/lib/content/repository";
import type { Frontmatter } from "@/lib/content/schema";

/**
 * Resultado de `saveEntity` (docs/04 §7.1). Discriminado por `ok`; no caminho de
 * erro, `kind` classifica o motivo (conflito otimista, validação Zod, política de
 * escrita ou falha inesperada) e `fieldErrors` mapeia campo -> mensagem.
 */
export type SaveResult =
  | { ok: true; revision: number; updated: string }
  | {
      ok: false;
      kind: "conflict" | "validation" | "policy" | "unknown";
      message: string;
      fieldErrors?: Record<string, string>;
    };

export interface SaveEntityInput {
  id: string;
  baseRevision: number;
  frontmatterPatch: Record<string, unknown>;
  body: string;
}

/** Entrada das ações de decisão sobre uma proposta de agente. */
export interface ProposalActionInput {
  id: string;
  baseRevision: number;
}

/**
 * Traduz os erros de domínio do repositório no ramo de erro de `SaveResult`
 * (docs/04 §7.1). Compartilhado por `saveEntity` e pelas ações de proposta.
 */
function toErrorResult(e: unknown): Extract<SaveResult, { ok: false }> {
  if (e instanceof ConflictError) {
    return {
      ok: false,
      kind: "conflict",
      message:
        "O conteúdo mudou desde que você abriu. Recarregue e tente de novo.",
    };
  }
  if (e instanceof ValidationError) {
    return {
      ok: false,
      kind: "validation",
      message: e.message,
      fieldErrors: e.fieldErrors,
    };
  }
  if (e instanceof PolicyError) {
    return {
      ok: false,
      kind: "policy",
      message: "Escrita bloqueada pela política desta entidade.",
    };
  }
  return { ok: false, kind: "unknown", message: "Falha ao salvar." };
}

/** Revalida a página de cards da seção e a página de edição da entidade. */
function revalidateEntity(id: string): void {
  const [section] = id.split("/");
  if (section) revalidatePath(`/${section}`); // atualiza os cards da seção
  revalidatePath(`/${id}`); // e a página de edição
}

/**
 * Caminho primário de escrita da UI (docs/04 §7.1). Chama `writeEntity` como
 * `editor: 'founder'`, revalida a página de cards da seção e a de edição, e
 * traduz os erros de domínio em um `SaveResult` para o form consumir via
 * `useActionState`. Roda no runtime Node (host: page da entidade com fs).
 */
export async function saveEntity(input: SaveEntityInput): Promise<SaveResult> {
  try {
    const doc = await writeEntity({
      id: input.id,
      editor: "founder", // UI = founder (agentes usam a mesma função server-side)
      baseRevision: input.baseRevision,
      frontmatterPatch: input.frontmatterPatch as Partial<Frontmatter>,
      body: input.body,
    });

    revalidateEntity(input.id);

    return {
      ok: true,
      revision: doc.frontmatter.revision,
      updated: doc.frontmatter.updated,
    };
  } catch (e) {
    return toErrorResult(e);
  }
}

/**
 * Aprova uma proposta de agente (docs/05 §6). O founder assume o conteúdo
 * proposto: escreve como `editor: 'founder'` movendo `status` de
 * `needs_review` para `in_progress`. O corpo permanece intacto (só o
 * frontmatter muda). Reusa o gate de conflito otimista de `writeEntity`.
 */
export async function approveProposal(
  input: ProposalActionInput,
): Promise<SaveResult> {
  try {
    const doc = await writeEntity({
      id: input.id,
      editor: "founder",
      baseRevision: input.baseRevision,
      frontmatterPatch: { status: "in_progress" },
    });

    revalidateEntity(input.id);

    return {
      ok: true,
      revision: doc.frontmatter.revision,
      updated: doc.frontmatter.updated,
    };
  } catch (e) {
    return toErrorResult(e);
  }
}

/**
 * Rejeita uma proposta de agente (docs/05 §6). Marca como não-aprovada movendo
 * `status` de `needs_review` para `draft`, como `editor: 'founder'`. O corpo
 * proposto permanece para o founder editar; o histórico real fica no git.
 */
export async function rejectProposal(
  input: ProposalActionInput,
): Promise<SaveResult> {
  try {
    const doc = await writeEntity({
      id: input.id,
      editor: "founder",
      baseRevision: input.baseRevision,
      frontmatterPatch: { status: "draft" },
    });

    revalidateEntity(input.id);

    return {
      ok: true,
      revision: doc.frontmatter.revision,
      updated: doc.frontmatter.updated,
    };
  } catch (e) {
    return toErrorResult(e);
  }
}
