import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { config } from "@/lib/config";

/**
 * Cliente Supabase ADMINISTRATIVO (service_role) — SERVER-ONLY.
 *
 * Contorna a RLS. Uso restrito a operacoes sem sessao HTTP que precisam agir
 * sobre um tenant explicito: seed/onboarding, ETL de migracao e os CLIs de agente
 * (`agent:read`/`agent:write`), que rodam como o admin. O isolamento por tenant,
 * nesses caminhos, e responsabilidade do codigo (filtrar por `user_id`), nao da RLS.
 *
 * O import de "server-only" garante erro de build se algum bundle client tentar
 * puxar este modulo.
 */
export function createAdminClient() {
  return createSupabaseClient(
    config.NEXT_PUBLIC_SUPABASE_URL!,
    config.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
