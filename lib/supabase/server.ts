import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para o SERVIDOR (RSC, Server Actions, Route Handlers).
 * Le/escreve a sessao nos cookies do request via `@supabase/ssr`. Autentica como
 * o usuario logado — todas as queries respeitam a RLS (isolamento por tenant).
 *
 * `setAll` pode lancar quando chamado de um Server Component (cookies read-only);
 * nesse caso o refresh de sessao e feito pelo middleware — engolimos o erro.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Chamado de um Server Component: ignoravel (middleware faz o refresh).
          }
        },
      },
    },
  );
}
