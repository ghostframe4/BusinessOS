/**
 * Cliente (browser) da rota `POST /api/ai/fill`. Isomorfico/seguro para client
 * components — apenas `fetch`, sem segredos. A rota faz o trabalho pesado
 * (autenticacao, geracao e escrita como proposta needs_review).
 */

export type AiFillMode = "draft" | "briefing" | "report";

export interface AiFillSuccess {
  ok: true;
  revision: number;
  status: string;
}

export interface AiFillFailure {
  ok: false;
  kind: string;
  message: string;
}

export type AiFillResult = AiFillSuccess | AiFillFailure;

export interface AiFillInput {
  id: string;
  mode: AiFillMode;
  /** Orientacao livre do founder (modo `draft`). */
  userPrompt?: string;
  /** Respostas do questionario (modo `briefing`): heading -> texto. */
  answers?: Record<string, string>;
}

/** Chama a rota de IA e devolve o resultado tipado (nunca lanca). */
export async function requestAiFill(input: AiFillInput): Promise<AiFillResult> {
  try {
    const res = await fetch("/api/ai/fill", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return (await res.json()) as AiFillResult;
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "Falha de rede ao chamar a IA. Tente novamente.",
    };
  }
}
