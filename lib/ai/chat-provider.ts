import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { config, CHAT_ENABLED } from "@/lib/config";
import { DEFAULT_CHAT_MODEL_ID, isChatModelId } from "@/lib/ai/chat-models";

/**
 * Provider do chat da pagina Principal (SPEC). Usa OpenAI (ChatGPT) via
 * `@ai-sdk/openai`. Espelha o padrao de `lib/ai/provider.ts::resolveModel()`:
 * lazy, le a chave do `config` validado e lanca se ausente.
 *
 * "Cabo solto": sem `OPENAI_API_KEY`, `CHAT_ENABLED` e falso e a rota `/api/chat`
 * responde 503 antes de tocar aqui. O throw abaixo e defesa em profundidade.
 */

/** Modelo padrao do chat (re-export do catalogo client-safe). */
export const CHAT_MODEL_ID = DEFAULT_CHAT_MODEL_ID;

/**
 * Resolve o modelo de linguagem da OpenAI. Lanca se a chave faltar.
 * `modelId` (do body do chat) so e aceito se estiver na allowlist de
 * `chat-models`; qualquer outra coisa cai no padrao.
 */
export function resolveChatModel(modelId?: string): LanguageModel {
  if (!CHAT_ENABLED) {
    throw new Error(
      "OPENAI_API_KEY ausente: o chat da pagina Principal nao esta configurado.",
    );
  }
  const id = isChatModelId(modelId) ? modelId : DEFAULT_CHAT_MODEL_ID;
  const openai = createOpenAI({ apiKey: config.OPENAI_API_KEY });
  return openai(id);
}
