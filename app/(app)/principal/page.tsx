import { ChatView } from "@/components/chat/chat-view";
import { CHAT_ENABLED } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Página Principal — estado vazio (SPEC). Sem conversa aberta: saudação grande
 * + composer centralizados (estilo ChatGPT). No 1º envio, o `ChatView` cria a
 * conversa e navega para `/principal/[id]`.
 */
export default function PrincipalPage() {
  return (
    <ChatView greeting="Como posso ajudar, Ruan?" chatEnabled={CHAT_ENABLED} />
  );
}
