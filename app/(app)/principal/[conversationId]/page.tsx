import { notFound } from "next/navigation";
import type { UIMessage } from "ai";

import { ChatView } from "@/components/chat/chat-view";
import { CHAT_ENABLED } from "@/lib/config";
import {
  getConversation,
  listMessages,
} from "@/lib/knowledge/conversations";
import type { ChatMessage } from "@/lib/knowledge/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Converte uma mensagem persistida no formato UIMessage do AI SDK v7. */
function toUIMessage(m: ChatMessage): UIMessage {
  return {
    id: m.id,
    role: m.role,
    parts: [{ type: "text", text: m.content }],
  };
}

/**
 * Página de conversa aberta (SPEC). Carrega a conversa (404 se não existir ou
 * não for do usuário) e o histórico, passando-o como `initialMessages`.
 */
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const conversation = await getConversation(conversationId);
  if (!conversation) notFound();

  const messages = await listMessages(conversationId);

  return (
    <ChatView
      conversationId={conversationId}
      initialMessages={messages.map(toUIMessage)}
      greeting={conversation.title}
      chatEnabled={CHAT_ENABLED}
    />
  );
}
