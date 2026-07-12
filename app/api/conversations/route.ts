import { NextResponse } from "next/server";

import {
  createConversation,
  listConversations,
} from "@/lib/knowledge/conversations";

export const runtime = "nodejs"; // usa o cliente Supabase server (RLS por cookies)
export const dynamic = "force-dynamic"; // sempre reflete o estado atual

/**
 * GET /api/conversations — lista as conversas do usuario (ordem: updated desc).
 * Resposta: `Conversation[]`.
 */
export async function GET(): Promise<Response> {
  try {
    const conversations = await listConversations();
    return NextResponse.json(conversations);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao listar conversas.";
    return NextResponse.json(
      { ok: false, kind: "unknown", message },
      { status: 502 },
    );
  }
}

/**
 * POST /api/conversations — cria uma conversa.
 * Body opcional: `{ title?: string }`. Resposta: `Conversation` (201).
 */
export async function POST(req: Request): Promise<Response> {
  let title: string | undefined;
  try {
    const body = (await req.json()) as { title?: unknown };
    if (typeof body?.title === "string" && body.title.trim()) {
      title = body.title.trim();
    }
  } catch {
    // corpo ausente/invalido -> cria com o titulo padrao.
  }

  try {
    const conversation = await createConversation(title);
    return NextResponse.json(conversation, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao criar conversa.";
    return NextResponse.json(
      { ok: false, kind: "unknown", message },
      { status: 502 },
    );
  }
}
