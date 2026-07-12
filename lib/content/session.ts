import "server-only";

import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

import { runWithContext, type ContentContext } from "./context";
import { getExtension } from "./entity-extensions";
import { REGISTRY } from "./registry";
import { buildSeedFrontmatter } from "./repository";
import { frontmatterSchema } from "./schema";
import { getStore } from "./store";
import { FileContentStore } from "./store/file-store";
import { SupabaseContentStore } from "./store/supabase-store";
import { renderTemplateBody, templateFor } from "./templates";

/**
 * Estabelecimento do CONTEXTO de conteudo (ADR 0001 §3) — a ponte entre os pontos
 * de entrada e o store escopado por tenant. Server-only.
 *
 * - `withUserContext`: para UI (RSC / Server Actions / Route Handlers). Resolve o
 *   usuario logado via cookies e roda `fn` com um store RLS. No modo `file`
 *   (dev/local, sem auth) roda como o founder.
 * - `withAdminContext`: para CLIs / ETL / onboarding. Age como um usuario
 *   explicito via service_role (contorna a RLS).
 * - `seedEntitiesForUser`: cria as 11 entidades vazias do tenant atual (idempotente).
 */

/** Usuario resolvido da sessao (subconjunto util). */
export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Roda `fn` no contexto do usuario LOGADO (store RLS). Lanca se nao autenticado
 * (modo supabase). No modo `file`, roda como founder sem exigir sessao.
 */
export async function withUserContext<T>(
  fn: (user: SessionUser | null) => Promise<T>,
): Promise<T> {
  if (config.CONTENT_STORE === "file") {
    const ctx: ContentContext = {
      store: new FileContentStore(config.CONTENT_ROOT),
      ownerEmail: config.FOUNDER_EMAIL,
    };
    return runWithContext(ctx, () => fn(null));
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new Error("Nao autenticado: withUserContext exige sessao valida.");
  }

  const sessionUser: SessionUser = { id: user.id, email: user.email };
  const ctx: ContentContext = {
    store: new SupabaseContentStore(supabase), // modo RLS (auth.uid())
    ownerEmail: sessionUser.email,
  };
  return runWithContext(ctx, () => fn(sessionUser));
}

/**
 * Roda `fn` agindo como o usuario `userId` (service_role, contorna RLS). Para
 * CLIs, ETL e onboarding, que nao tem sessao HTTP. No modo `file`, roda local.
 */
export async function withAdminContext<T>(
  userId: string,
  ownerEmail: string,
  fn: () => Promise<T>,
): Promise<T> {
  if (config.CONTENT_STORE === "file") {
    const ctx: ContentContext = {
      store: new FileContentStore(config.CONTENT_ROOT),
      ownerEmail,
    };
    return runWithContext(ctx, fn);
  }

  const admin = createAdminClient();
  const ctx: ContentContext = {
    store: new SupabaseContentStore(admin, userId),
    ownerEmail,
  };
  return runWithContext(ctx, fn);
}

/**
 * Semeia as 11 entidades vazias do REGISTRY para o tenant do contexto ATUAL
 * (deve rodar dentro de um `with*Context`). Idempotente: pula as ja existentes.
 * Reusa `buildSeedFrontmatter` + templates — nada duplicado em SQL (ADR 0001 §5).
 */
export async function seedEntitiesForUser(): Promise<{
  created: number;
  skipped: number;
}> {
  const store = getStore();
  const timestamp = new Date().toISOString();
  let created = 0;
  let skipped = 0;

  for (const def of REGISTRY) {
    if (await store.exists(def.id)) {
      skipped += 1;
      continue;
    }
    const frontmatter = buildSeedFrontmatter(def, timestamp);
    const body = renderTemplateBody(def.title, templateFor(def.id));

    const parsed = frontmatterSchema
      .and(getExtension(def.id))
      .safeParse(frontmatter);
    if (!parsed.success) {
      throw new Error(
        `Seed invalido para ${def.id}: ${parsed.error.issues
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; ")}`,
      );
    }

    await store.write(def.id, {
      data: frontmatter as unknown as Record<string, unknown>,
      body,
    });
    created += 1;
  }

  return { created, skipped };
}
