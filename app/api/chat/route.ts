import { NextResponse } from "next/server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { CHAT_ENABLED } from "@/lib/config";
import { resolveChatModel } from "@/lib/ai/chat-provider";
import {
  addMessage,
  listMessages,
  renameConversation,
  touchConversation,
} from "@/lib/knowledge/conversations";
import { retrieveContext } from "@/lib/knowledge/retrieval";
import { indexMessageForCurrentUser } from "@/lib/knowledge/indexing";
import type { KnowledgeMatch } from "@/lib/knowledge/types";

export const runtime = "nodejs"; // precisa de rede (AI SDK) e cliente Supabase server
export const dynamic = "force-dynamic"; // sempre reflete o estado atual

/**
 * POST /api/chat — chat em streaming ancorado na base de conhecimento (RAG).
 *
 * - Sem `OPENAI_API_KEY` (`!CHAT_ENABLED`): 503 claro em pt-BR — "cabo solto".
 * - Fluxo: extrai o texto do ultimo turno do usuario; se for a 1a mensagem da
 *   conversa, gera um titulo curto; salva a mensagem do usuario; recupera contexto
 *   (RAG); monta o system prompt; faz o streaming. Ao finalizar, salva a resposta
 *   do assistant, indexa-a para busca futura e "toca" a conversa (updated=now).
 *
 * Body (do useChat, AI SDK v7): `{ messages: UIMessage[], conversationId: string }`.
 */

interface ChatBody {
  messages?: UIMessage[];
  conversationId?: string;
  /** O useChat pode enviar o id da conversa como `id`; aceitamos como fallback. */
  id?: string;
  /** Modelo escolhido no seletor da UI; validado contra a allowlist. */
  model?: string;
}

/** Extrai o texto concatenado das partes `type:'text'` de um UIMessage v7. */
function extractText(message: UIMessage | undefined): string {
  if (!message) return "";
  const parts = Array.isArray(message.parts) ? message.parts : [];
  const text = parts
    .filter((p): p is { type: "text"; text: string } => p?.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
  if (text) return text;
  // Fallback defensivo: algumas versoes/clientes ainda enviam `content` string.
  const maybeContent = (message as { content?: unknown }).content;
  return typeof maybeContent === "string" ? maybeContent.trim() : "";
}

/** Gera um titulo curto (uma linha, ~48 chars) a partir do texto do usuario. */
function deriveTitle(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine) return "Nova conversa";
  return oneLine.length > 48 ? `${oneLine.slice(0, 48).trimEnd()}…` : oneLine;
}

/** Monta o system prompt em pt-BR, embutindo os trechos recuperados por fonte. */
function buildSystemPrompt(matches: KnowledgeMatch[]): string {
  const base = [
    "Voce e o assistente do BusinessOS, um OS de decisao para o founder.",
    "Responda SEMPRE ancorado na base de conhecimento do founder (as entidades do",
    "negocio e o historico de conversas), em portugues do Brasil, de forma direta e util.",
  ].join(" ");

  if (matches.length === 0) {
    return [
      base,
      "",
      "Nenhum trecho relevante foi recuperado da base para esta pergunta.",
      "Responda com o que voce sabe, mas sinalize que a resposta nao esta ancorada",
      "no contexto do founder e sugira registrar/atualizar a entidade correspondente.",
    ].join("\n");
  }

  const context = matches
    .map((m, i) => {
      const label =
        m.sourceType === "entity"
          ? `Entidade ${m.sourceId}`
          : `Conversa anterior (${m.sourceId})`;
      return `[Fonte ${i + 1} — ${label}]\n${m.content}`;
    })
    .join("\n\n");

  return [
    base,
    "",
    "Use os trechos abaixo como fonte primaria. Cite a fonte quando fizer sentido.",
    "Se os trechos nao cobrirem a pergunta, diga o que falta em vez de inventar.",
    "",
    "=== CONTEXTO RECUPERADO ===",
    context,
    "=== FIM DO CONTEXTO ===",
  ].join("\n");
}

export async function POST(req: Request): Promise<Response> {
  // Cabo solto: sem chave da OpenAI, o chat responde indisponivel (nada quebra).
  if (!CHAT_ENABLED) {
    return NextResponse.json(
      {
        ok: false,
        kind: "disabled",
        message:
          "IA de chat nao configurada — adicione OPENAI_API_KEY ao .env.local e reinicie o servidor.",
      },
      { status: 503 },
    );
  }

  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json(
      { ok: false, kind: "bad_request", message: "Corpo da requisicao invalido." },
      { status: 400 },
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const conversationId =
    typeof body.conversationId === "string"
      ? body.conversationId
      : typeof body.id === "string"
        ? body.id
        : "";

  if (!conversationId) {
    return NextResponse.json(
      {
        ok: false,
        kind: "bad_request",
        message: "conversationId e obrigatorio (crie a conversa antes de enviar).",
      },
      { status: 400 },
    );
  }

  // Ultimo turno do usuario (o que dispara esta resposta).
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = extractText(lastUser);
  if (!userText) {
    return NextResponse.json(
      { ok: false, kind: "bad_request", message: "Mensagem do usuario vazia." },
      { status: 400 },
    );
  }

  try {
    // Titulo automatico: antes de salvar, se a conversa ainda nao tem mensagens.
    const existing = await listMessages(conversationId);
    if (existing.length === 0) {
      try {
        await renameConversation(conversationId, deriveTitle(userText));
      } catch {
        // titulo e best-effort; nao bloquear o chat se falhar.
      }
    }

    // Persistir a mensagem do usuario e recuperar o contexto RAG.
    await addMessage(conversationId, "user", userText);
    const matches = await retrieveContext(userText);
    const system = buildSystemPrompt(matches);

    // Nesta versao do AI SDK v7 `convertToModelMessages` e assincrona.
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: resolveChatModel(body.model),
      system,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        try {
          const saved = await addMessage(conversationId, "assistant", text);
          try {
            await indexMessageForCurrentUser(saved.id, text);
          } catch {
            // indexacao e best-effort (depende de RAG_ENABLED / rede).
          }
          await touchConversation(conversationId);
        } catch {
          // nao ha stream para reverter aqui; erros de persistencia sao tolerados.
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido no chat.";
    return NextResponse.json(
      { ok: false, kind: "unknown", message },
      { status: 502 },
    );
  }
}
