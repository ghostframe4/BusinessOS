"use server";

import { revalidatePath } from "next/cache";

import { createAgent, slugify } from "@/lib/agents/repository";

/** Resultado de `createNewAgent`, consumido pelo form de criação. */
export type CreateAgentResult =
  | { ok: true; slug: string }
  | { ok: false; message: string };

export interface CreateAgentFormInput {
  slug: string;
  description: string;
  tools: string;
  systemPrompt: string;
}

/**
 * Cria um novo subagente em `.claude/agents/<slug>.md`. Normaliza o slug,
 * valida os campos mínimos, persiste e revalida a listagem.
 */
export async function createNewAgent(
  input: CreateAgentFormInput,
): Promise<CreateAgentResult> {
  const slug = slugify(input.slug);

  if (!slug) {
    return {
      ok: false,
      message: "Informe um nome válido (letras, números ou hífens).",
    };
  }
  if (!input.systemPrompt.trim()) {
    return { ok: false, message: "O system prompt não pode ficar vazio." };
  }

  try {
    const agent = await createAgent({
      slug,
      description: input.description,
      tools: input.tools,
      systemPrompt: input.systemPrompt,
    });

    revalidatePath("/agentes");
    revalidatePath(`/agentes/${agent.slug}`);

    return { ok: true, slug: agent.slug };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Falha ao criar o agente.",
    };
  }
}
