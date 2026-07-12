import { NextResponse } from "next/server";

import { readActiveActivity } from "@/lib/content/activity";
import { listEntities } from "@/lib/content/repository";
import { withUserContext } from "@/lib/content/session";

export const runtime = "nodejs"; // precisa de fs (lib/content)
export const dynamic = "force-dynamic"; // sempre reflete o disco/heartbeat

/** Item de atividade ao vivo servido ao board. */
export interface LiveActivity {
  slug: string;
  action: "read" | "write";
  entityId: string | null;
  /** Titulo da entidade, se resolvido no registry. */
  title: string | null;
  ts: number;
}

/**
 * GET /api/activity — agentes operando AGORA no terminal (batimentos dentro da
 * janela). O Workflow faz polling deste endpoint para a faixa "Trabalhando agora".
 */
export async function GET(): Promise<NextResponse> {
  const beats = await readActiveActivity();

  // Enriquecer com titulo so quando ha entidade em jogo.
  const titleById = new Map<string, string>();
  if (beats.some((b) => b.entityId)) {
    for (const meta of await withUserContext(() => listEntities())) {
      titleById.set(meta.id, meta.title);
    }
  }

  const active: LiveActivity[] = beats.map((b) => ({
    slug: b.slug,
    action: b.action,
    entityId: b.entityId,
    title: b.entityId ? (titleById.get(b.entityId) ?? null) : null,
    ts: b.ts,
  }));

  return NextResponse.json(
    { active },
    { headers: { "Cache-Control": "no-store" } },
  );
}
