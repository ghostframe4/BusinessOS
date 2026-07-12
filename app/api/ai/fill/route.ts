import { NextResponse } from "next/server";

import { AI_ENABLED } from "@/lib/config";
import {
  generateBriefingDraft,
  generateEntityDraft,
  generateReportDraft,
  type EntityDraftContext,
  type RelatedContext,
} from "@/lib/ai/provider";
import {
  ConflictError,
  NotInRegistryError,
  PolicyError,
  ValidationError,
} from "@/lib/content/errors";
import { readEntity, writeEntity } from "@/lib/content/repository";
import { withUserContext } from "@/lib/content/session";

export const runtime = "nodejs"; // precisa de fs/rede (lib/content + AI SDK)
export const dynamic = "force-dynamic"; // sempre reflete o estado atual

/**
 * POST /api/ai/fill — a IA PROPOE uma versao de uma entidade (ADR 0001 §6).
 *
 * - Sem `ANTHROPIC_API_KEY` (`!AI_ENABLED`): 503 claro em pt-BR — "cabo solto".
 * - Com a chave: gera a sugestao e grava pela MESMA porta que os humanos
 *   (`writeEntity` com `editor: 'agent:ai'` -> sob write_policy 'propose' vira
 *   `status: needs_review`; o founder aprova na UI). A IA nunca contorna a politica.
 *
 * Modos: `draft` (Pedir a IA), `briefing` (Gerar briefing), `report` (Gerar relatorio).
 */

type Mode = "draft" | "briefing" | "report";

interface FillBody {
  id?: string;
  mode?: Mode;
  userPrompt?: string;
  answers?: Record<string, string>;
}

function bad(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, kind: "bad_request", message }, { status });
}

function mapError(err: unknown): NextResponse {
  if (err instanceof PolicyError) {
    return NextResponse.json(
      {
        ok: false,
        kind: "policy",
        message: "Esta entidade e founder_only: a IA nao pode gravar.",
      },
      { status: 403 },
    );
  }
  if (err instanceof ConflictError) {
    return NextResponse.json(
      {
        ok: false,
        kind: "conflict",
        message: "O conteudo mudou desde a leitura. Recarregue e tente de novo.",
      },
      { status: 409 },
    );
  }
  if (err instanceof ValidationError) {
    return NextResponse.json(
      { ok: false, kind: "validation", message: err.message },
      { status: 422 },
    );
  }
  if (err instanceof NotInRegistryError) {
    return NextResponse.json(
      { ok: false, kind: "not_found", message: "Entidade fora do registro." },
      { status: 404 },
    );
  }
  const message =
    err instanceof Error ? err.message : "Erro desconhecido ao gerar com IA.";
  return NextResponse.json({ ok: false, kind: "unknown", message }, { status: 502 });
}

export async function POST(req: Request): Promise<NextResponse> {
  // Cabo solto: sem chave, a IA responde indisponivel (nada quebra).
  if (!AI_ENABLED) {
    return NextResponse.json(
      {
        ok: false,
        kind: "disabled",
        message:
          "IA nao configurada — adicione ANTHROPIC_API_KEY ao .env.local e reinicie o servidor.",
      },
      { status: 503 },
    );
  }

  let body: FillBody;
  try {
    body = (await req.json()) as FillBody;
  } catch {
    return bad("Corpo da requisicao invalido.");
  }

  const id = typeof body.id === "string" ? body.id : "";
  const mode = body.mode;
  if (!id || (mode !== "draft" && mode !== "briefing" && mode !== "report")) {
    return bad("Parametros invalidos (id, mode).");
  }

  try {
    const result = await withUserContext(async () => {
      const doc = await readEntity(id);
      const fm = doc.frontmatter;

      // Nao empilhar propostas: se ja ha uma pendente, pare (CLAUDE.md).
      if (fm.status === "needs_review") {
        return { pending: true as const };
      }

      // Contexto: le as entidades relacionadas (profundidade 1).
      const related: RelatedContext[] = [];
      for (const rid of fm.ai_context.related ?? []) {
        try {
          const r = await readEntity(rid);
          related.push({
            id: r.frontmatter.id,
            title: r.frontmatter.title,
            summary: r.frontmatter.summary,
            body: r.body,
          });
        } catch {
          // relacionado ausente/invalido — ignora (contexto e best-effort)
        }
      }

      const ctx: EntityDraftContext = {
        id: fm.id,
        title: fm.title,
        section: fm.section,
        purpose: fm.ai_context.purpose,
        instructions: fm.ai_context.instructions,
        currentBody: doc.body,
        related,
      };

      if (mode === "report") {
        const report = await generateReportDraft(ctx);
        const written = await writeEntity({
          id,
          editor: "agent:ai",
          baseRevision: fm.revision,
          frontmatterPatch: { report },
        });
        return { written };
      }

      const draft =
        mode === "briefing"
          ? await generateBriefingDraft(
              ctx,
              Object.entries(body.answers ?? {}).map(([heading, answer]) => ({
                heading,
                answer: String(answer ?? ""),
              })),
            )
          : await generateEntityDraft(ctx, body.userPrompt);

      const written = await writeEntity({
        id,
        editor: "agent:ai",
        baseRevision: fm.revision,
        frontmatterPatch: { summary: draft.summary },
        body: draft.body,
      });
      return { written };
    });

    if ("pending" in result) {
      return NextResponse.json(
        {
          ok: false,
          kind: "pending",
          message:
            "Ja existe uma proposta pendente para esta entidade — revise-a antes de gerar outra.",
        },
        { status: 409 },
      );
    }

    const fm = result.written.frontmatter;
    return NextResponse.json({
      ok: true,
      revision: fm.revision,
      status: fm.status,
    });
  } catch (err) {
    return mapError(err);
  }
}
