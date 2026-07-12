/**
 * Seeder de conteudo (docs/04-technical-spec.md §7.3 / docs/02-content-model.md §8.4).
 *
 * Semeia as 11 entidades vazias do REGISTRY para o tenant ADMIN (o founder). Roda
 * via `tsx` (`pnpm seed`), SEM sessao HTTP — por isso age como o admin via
 * `withAdminContext` (ADR 0001 §3/§5):
 *  - Modo `file` (dev/local): roda local como founder, cria os arquivos
 *    `content/<section>/<entity>.md` ausentes.
 *  - Modo `supabase`: resolve o admin em `profiles` e semeia sob o `user_id` dele
 *    (service_role, contorna a RLS).
 *
 * A logica canonica de seed vive em `seedEntitiesForUser` (reusa
 * `buildSeedFrontmatter` + templates + validacao zod) — nada duplicado aqui.
 * IDEMPOTENTE: entidades ja existentes sao preservadas (nunca sobrescritas).
 */
import { REGISTRY } from "@/lib/content/registry";
import { seedEntitiesForUser, withAdminContext } from "@/lib/content/session";

import { resolveAdmin } from "./lib/resolve-admin";

async function main(): Promise<void> {
  const admin = await resolveAdmin();
  const target = admin.userId
    ? `${admin.email} (${admin.userId})`
    : `${admin.email} (modo file)`;

  const { created, skipped } = await withAdminContext(
    admin.userId,
    admin.email,
    () => seedEntitiesForUser(),
  );

  console.log(`Tenant alvo: ${target}`);
  console.log(
    `Seed concluido: ${created} criado(s), ${skipped} preservado(s), ` +
      `${REGISTRY.length} entidade(s) no registro.`,
  );
}

main().catch((err) => {
  console.error("Falha no seeder:", err instanceof Error ? err.message : err);
  process.exit(1);
});
