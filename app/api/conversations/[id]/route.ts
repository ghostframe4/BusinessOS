import { NextResponse } from "next/server";

import {
  deleteConversation,
  renameConversation,
} from "@/lib/knowledge/conversations";

export const runtime = "nodejs"; // usa o cliente Supabase server (RLS por cookies)
export const dynamic = "force-dynamic"; // sempre reflete o estado atual

// Next 16: o segundo argumento traz `params` como Promise.
type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/conversations/[id] — exclui a conversa (e suas mensagens em cascata).
 * Resposta: 204 sem corpo.
 */
export async function DELETE(
  _req: Request,
  { params }: RouteContext,
): Promise<Response> {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, kind: "bad_request", message: "id da conversa ausente." },
      { status: 400 },
    );
  }

  try {
    await deleteConversation(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao excluir conversa.";
    return NextResponse.json(
      { ok: false, kind: "unknown", message },
      { status: 502 },
    );
  }
}

/**
 * PATCH /api/conversations/[id] — renomeia a conversa.
 * Body: `{ title: string }`. Resposta: 200 `{ ok: true }`.
 */
export async function PATCH(
  req: Request,
  { params }: RouteContext,
): Promise<Response> {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, kind: "bad_request", message: "id da conversa ausente." },
      { status: 400 },
    );
  }

  let title = "";
  try {
    const body = (await req.json()) as { title?: unknown };
    if (typeof body?.title === "string") title = body.title.trim();
  } catch {
    // tratado abaixo como titulo invalido.
  }

  if (!title) {
    return NextResponse.json(
      { ok: false, kind: "bad_request", message: "title e obrigatorio." },
      { status: 400 },
    );
  }

  try {
    await renameConversation(id, title);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao renomear conversa.";
    return NextResponse.json(
      { ok: false, kind: "unknown", message },
      { status: 502 },
    );
  }
}
