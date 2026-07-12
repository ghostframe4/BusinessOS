import type { ReactNode } from "react";

import { ConversationRail } from "@/components/chat/conversation-rail";
import { listConversations } from "@/lib/knowledge/conversations";

export const runtime = "nodejs"; // usa DB (lib/knowledge) via Supabase server client
export const dynamic = "force-dynamic"; // conversas por-usuário, nunca pré-renderizadas

/**
 * Layout da página Principal (SPEC): sidebar dupla. Renderiza a rail de
 * conversas (segundo painel escuro flutuante) ao lado do conteúdo do chat.
 * A rail é um Server Component que lista as conversas do usuário logado (RLS).
 */
export default async function PrincipalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const conversations = await listConversations();

  return (
    <div className="flex min-h-dvh">
      <ConversationRail conversations={conversations} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
