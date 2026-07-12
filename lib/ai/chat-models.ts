/**
 * Catálogo de modelos do chat da página Principal (client-safe: sem `server-only`,
 * pode ser importado no seletor de UI e no provider/route no servidor).
 *
 * Allowlist central: a UI só oferece estes ids e a rota `/api/chat` valida contra
 * eles antes de resolver o modelo — nunca confia num id arbitrário vindo do body.
 */
export const CHAT_MODELS = [
  { id: "gpt-4o", label: "GPT-4o", hint: "Equilibrado (padrão)" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", hint: "Rápido e econômico" },
  { id: "gpt-4.1", label: "GPT-4.1", hint: "Mais capaz" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 mini", hint: "Ágil" },
] as const;

export type ChatModelId = (typeof CHAT_MODELS)[number]["id"];

export const CHAT_MODEL_IDS = CHAT_MODELS.map((m) => m.id) as ChatModelId[];

/** Modelo padrão quando nada é selecionado (ou o id recebido é inválido). */
export const DEFAULT_CHAT_MODEL_ID: ChatModelId = "gpt-4o";

/** Type guard: `v` é um id de modelo permitido? */
export function isChatModelId(v: unknown): v is ChatModelId {
  return typeof v === "string" && (CHAT_MODEL_IDS as string[]).includes(v);
}

/** Rótulo curto de um id (fallback: o próprio id). */
export function chatModelLabel(id: string): string {
  return CHAT_MODELS.find((m) => m.id === id)?.label ?? id;
}
