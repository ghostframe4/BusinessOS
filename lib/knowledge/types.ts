/**
 * Tipos do dominio de "conhecimento" (chat + RAG) da pagina Principal (SPEC).
 * Camada de apresentacao: nomes em camelCase (o banco usa snake_case; as funcoes
 * de `lib/knowledge/*` fazem a traducao).
 */

/** Uma conversa do chat (uma thread na rail lateral). */
export interface Conversation {
  id: string;
  title: string;
  created: string;
  updated: string;
}

/** Uma mensagem persistida de uma conversa. */
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  created: string;
}

/** Um trecho recuperado da base de conhecimento (resultado do RAG). */
export interface KnowledgeMatch {
  id: string;
  sourceType: "entity" | "message";
  sourceId: string;
  content: string;
  similarity: number;
}
