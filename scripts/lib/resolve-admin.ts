/**
 * Resolucao do usuario ADMIN para os pontos de entrada `tsx` (CLIs / seeder / ETL).
 *
 * Os CLIs de agente e o seeder rodam via `tsx` (Node puro, SEM sessao HTTP). No
 * mundo multi-tenant (ADR 0001) eles precisam agir como um usuario concreto — o
 * ADMIN (o founder) — via `withAdminContext(userId, email, fn)` (service_role,
 * contorna a RLS).
 *
 * - Modo `file` (atual / dev): nao ha banco nem `user_id`. Roda local como founder;
 *   `withAdminContext` ignora o `userId` e usa um `FileContentStore`.
 * - Modo `supabase`: consulta `public.profiles` para descobrir o `id` (uuid) e o
 *   `email` do admin, para agir sob o tenant correto.
 */
import { config } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AdminIdentity {
  /** uuid do admin em `auth.users`/`profiles` (vazio no modo `file`). */
  userId: string;
  /** e-mail do admin (owner do tenant). */
  email: string;
}

interface ProfileRow {
  id: string;
  email: string | null;
}

/**
 * Descobre o admin SEMPRE no Supabase (independente do `CONTENT_STORE`). Util para
 * o ETL, que precisa do `user_id` real do admin mesmo enquanto a app ainda roda em
 * modo `file`. Estrategia: primeiro `role='admin'`; se nao houver, cai para o
 * `email = FOUNDER_EMAIL`. Lanca um erro claro se nao houver admin cadastrado.
 */
export async function resolveSupabaseAdmin(): Promise<AdminIdentity> {
  const supabase = createAdminClient();

  // 1) Admin por papel.
  let { data, error } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle<ProfileRow>();
  if (error) throw error;

  // 2) Fallback: perfil com o e-mail do founder (caso o papel ainda nao esteja setado).
  if (!data) {
    ({ data, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", config.FOUNDER_EMAIL)
      .limit(1)
      .maybeSingle<ProfileRow>());
    if (error) throw error;
  }

  if (!data) {
    throw new Error(
      "Nenhum usuario admin encontrado — o founder precisa se cadastrar primeiro " +
        `em /signup com o e-mail do founder (${config.FOUNDER_EMAIL}).`,
    );
  }

  return { userId: data.id, email: data.email ?? config.FOUNDER_EMAIL };
}

/**
 * Resolve o admin conforme o modo de persistencia atual:
 * - `file`: `{ userId: '', email: FOUNDER_EMAIL }` (roda local como founder).
 * - `supabase`: delega para `resolveSupabaseAdmin()`.
 */
export async function resolveAdmin(): Promise<AdminIdentity> {
  if (config.CONTENT_STORE === "file") {
    return { userId: "", email: config.FOUNDER_EMAIL };
  }
  return resolveSupabaseAdmin();
}
