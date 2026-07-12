import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ChatMessage, Conversation } from "./types";

/**
 * CRUD de conversas e mensagens do chat (SPEC — pagina Principal).
 *
 * Server-only. Usa o cliente Supabase de SESSAO (`@/lib/supabase/server`), que
 * respeita a RLS por `auth.uid() = user_id`. Portanto NAO filtramos/gravamos
 * `user_id` manualmente: o INSERT cai no default `auth.uid()` e as leituras so
 * enxergam as linhas do usuario logado.
 */

const CONVERSATIONS = "conversations";
const MESSAGES = "messages";

/** Linha crua de `conversations`. */
interface ConversationRow {
  id: string;
  title: string;
  created: string;
  updated: string;
}

/** Linha crua de `messages`. */
interface MessageRow {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created: string;
}

function toConversation(r: ConversationRow): Conversation {
  return {
    id: r.id,
    title: r.title,
    created: r.created,
    updated: r.updated,
  };
}

function toMessage(r: MessageRow): ChatMessage {
  return {
    id: r.id,
    conversationId: r.conversation_id,
    role: r.role,
    content: r.content,
    created: r.created,
  };
}

/** Lista as conversas do usuario, mais recentes primeiro. */
export async function listConversations(): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(CONVERSATIONS)
    .select("id, title, created, updated")
    .order("updated", { ascending: false })
    .returns<ConversationRow[]>();
  if (error) throw error;
  return (data ?? []).map(toConversation);
}

/** Busca uma conversa por id (ou null se nao existir / nao for do usuario). */
export async function getConversation(
  id: string,
): Promise<Conversation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(CONVERSATIONS)
    .select("id, title, created, updated")
    .eq("id", id)
    .maybeSingle<ConversationRow>();
  if (error) throw error;
  return data ? toConversation(data) : null;
}

/** Cria uma nova conversa (titulo default no banco: 'Nova conversa'). */
export async function createConversation(
  title?: string,
): Promise<Conversation> {
  const supabase = await createClient();
  // Sob RLS, `user_id` cai no default `auth.uid()`. So passamos `title` se dado.
  const insertRow: Record<string, unknown> = {};
  if (title !== undefined && title.trim() !== "") insertRow.title = title.trim();

  const { data, error } = await supabase
    .from(CONVERSATIONS)
    .insert(insertRow)
    .select("id, title, created, updated")
    .single<ConversationRow>();
  if (error) throw error;
  return toConversation(data);
}

/** Renomeia uma conversa e marca `updated=now()`. */
export async function renameConversation(
  id: string,
  title: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from(CONVERSATIONS)
    .update({ title, updated: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Exclui uma conversa (mensagens caem em cascade no banco). */
export async function deleteConversation(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from(CONVERSATIONS).delete().eq("id", id);
  if (error) throw error;
}

/** Lista as mensagens de uma conversa, ordem cronologica (asc). */
export async function listMessages(
  conversationId: string,
): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(MESSAGES)
    .select("id, conversation_id, role, content, created")
    .eq("conversation_id", conversationId)
    .order("created", { ascending: true })
    .returns<MessageRow[]>();
  if (error) throw error;
  return (data ?? []).map(toMessage);
}

/** Adiciona uma mensagem a uma conversa. `user_id` via default auth.uid(). */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
): Promise<ChatMessage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(MESSAGES)
    .insert({ conversation_id: conversationId, role, content })
    .select("id, conversation_id, role, content, created")
    .single<MessageRow>();
  if (error) throw error;
  return toMessage(data);
}

/** Marca a conversa como atualizada agora (para reordenar a rail). */
export async function touchConversation(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from(CONVERSATIONS)
    .update({ updated: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
