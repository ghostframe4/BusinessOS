"use server";

import { revalidatePath } from "next/cache";

import { writeAgent } from "@/lib/agents/repository";

/** Resultado de `saveAgent`, consumido pelo editor via `useActionState`. */
export type SaveAgentResult =
  | { ok: true }
  | { ok: false; message: string };

export interface SaveAgentInput {
  slug: string;
  description: string;
  systemPrompt: string;
}

/**
 * Salva o system prompt (e a descrição) de um subagente em
 * `.claude/agents/<slug>.md` e revalida as rotas de agentes.
 */
export async function saveAgent(
  input: SaveAgentInput,
): Promise<SaveAgentResult> {
  if (!input.systemPrompt.trim()) {
    return { ok: false, message: "O system prompt não pode ficar vazio." };
  }

  try {
    await writeAgent({
      slug: input.slug,
      systemPrompt: input.systemPrompt,
      description: input.description,
    });

    revalidatePath("/agentes");
    revalidatePath(`/agentes/${input.slug}`);

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Falha ao salvar o agente.",
    };
  }
}
