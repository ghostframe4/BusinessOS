"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { toast } from "sonner";

import { ChatComposer } from "@/components/chat/chat-composer";
import { MessageList } from "@/components/chat/message-list";
import { DEFAULT_CHAT_MODEL_ID } from "@/lib/ai/chat-models";
import type { Conversation } from "@/lib/knowledge/types";

export interface ChatViewProps {
  /** Conversa aberta; ausente = página vazia (estado inicial estilo ChatGPT). */
  conversationId?: string;
  /** Histórico já persistido, convertido para UIMessage (só no modo conversa). */
  initialMessages?: UIMessage[];
  /** Saudação grande do estado vazio. */
  greeting: string;
  /** Cabo solto: sem OPENAI_API_KEY o composer fica desabilitado. */
  chatEnabled: boolean;
}

/** Cria uma conversa nova no servidor (RLS via cookies). */
async function createConversation(): Promise<Conversation> {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error("Falha ao criar conversa");
  return (await res.json()) as Conversation;
}

/**
 * Orquestra o chat da página Principal (SPEC). Usa `useChat` (AI SDK v7) com um
 * `DefaultChatTransport` que injeta o `conversationId` corrente no body a cada
 * requisição — o id é lido de um ref, então não há corrida ao criar a conversa
 * no primeiro envio (sem recriar o transport).
 *
 * Fluxo estilo ChatGPT:
 * - Sem conversa: saudação grande centralizada + composer. No 1º envio, cria a
 *   conversa, transmite a resposta na própria view e, ao terminar, troca a URL
 *   para `/principal/[id]` (`router.replace` + `router.refresh` atualiza a rail).
 * - Com conversa: lista de mensagens + composer fixo embaixo.
 */
export function ChatView({
  conversationId,
  initialMessages,
  greeting,
  chatEnabled,
}: ChatViewProps) {
  const router = useRouter();

  // Id corrente da conversa, lido pelo transport no momento do request.
  const conversationIdRef = useRef<string | undefined>(conversationId);
  const [creating, setCreating] = useState(false);

  // Modelo escolhido no seletor do composer. Lido pelo transport via ref para
  // não recriar o transport a cada troca de modelo.
  const [model, setModel] = useState<string>(DEFAULT_CHAT_MODEL_ID);
  const modelRef = useRef(model);
  modelRef.current = model;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        // `body` aceita função (Resolvable): resolve id e modelo a cada envio.
        body: () => ({
          conversationId: conversationIdRef.current,
          model: modelRef.current,
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: initialMessages,
  });

  const busy = creating || status === "submitted" || status === "streaming";
  const hasThread = messages.length > 0;

  async function handleSend(text: string) {
    if (!chatEnabled) return;

    // Primeiro envio na página vazia: cria a conversa antes de transmitir.
    if (!conversationIdRef.current) {
      try {
        setCreating(true);
        const conv = await createConversation();
        conversationIdRef.current = conv.id;
        setCreating(false);
        await sendMessage({ text });
        // Stream concluído e mensagens já persistidas: canonicaliza a URL e
        // atualiza a rail de conversas (Server Component do layout).
        router.replace(`/principal/${conv.id}`);
        router.refresh();
      } catch {
        setCreating(false);
        toast.error("Não foi possível iniciar a conversa. Tente de novo.");
      }
      return;
    }

    void sendMessage({ text });
  }

  // Falha de rede/servidor durante o stream: aviso discreto, uma vez por erro.
  useEffect(() => {
    if (error) toast.error("A IA falhou ao responder. Tente novamente.");
  }, [error]);

  const composer = (
    <ChatComposer
      onSend={handleSend}
      busy={busy}
      disabled={!chatEnabled}
      model={model}
      onModelChange={setModel}
      autoFocus
    />
  );

  const disabledNotice = !chatEnabled ? (
    <p className="mx-auto mt-3 max-w-3xl px-4 text-center text-xs text-muted-foreground">
      IA de chat indisponível (falta OPENAI_API_KEY).
    </p>
  ) : null;

  // Estado vazio: saudação grande centralizada + composer.
  if (!hasThread) {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-4">
        <div className="w-full max-w-3xl">
          <h1 className="mb-8 text-center text-3xl font-semibold text-foreground md:text-4xl">
            {greeting}
          </h1>
          {composer}
          {disabledNotice}
        </div>
      </div>
    );
  }

  // Modo conversa: lista rolável + composer fixo embaixo.
  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col">
      <div className="flex-1">
        <MessageList messages={messages} streaming={busy} />
      </div>
      <div className="sticky bottom-0 border-t border-border/60 bg-background/80 pb-4 pt-3 backdrop-blur">
        <div className="mx-auto w-full max-w-3xl px-4">
          {composer}
          {disabledNotice}
        </div>
      </div>
    </div>
  );
}
