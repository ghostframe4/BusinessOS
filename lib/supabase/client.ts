import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para o BROWSER (client components). Le as vars publicas
 * (`NEXT_PUBLIC_*`) que o Next inlina no bundle. Autentica como o usuario logado
 * (sessao em cookies) — sujeito a RLS. NUNCA use chaves secretas aqui.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
