import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh de sessao + protecao de rotas no padrao oficial @supabase/ssr para
 * Next.js 16 (ADR 0001 §4). Chamada pelo `middleware.ts` da raiz.
 *
 * - Reemite os cookies de sessao (o token e renovado a cada request).
 * - No modo `file` (dev/local, sem auth) NAO exige login — a app continua
 *   rodando sem sessao. So o modo `supabase` protege as rotas.
 * - Sem sessao numa rota de app -> redireciona para `/login`.
 *
 * IMPORTANTE: nao rode logica entre `createServerClient` e `getUser()`; o token
 * so e revalidado nessa chamada (recomendacao oficial contra logout aleatorio).
 */

/** Prefixos publicos: acessiveis sem sessao. */
const PUBLIC_PREFIXES = ["/login", "/signup", "/auth"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  // Modo `file`: sem auth. Deixa passar tudo para nao quebrar o dev.
  if ((process.env.CONTENT_STORE ?? "file") !== "supabase") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Sem sessao numa rota protegida -> manda para o login.
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Ja logado tentando ver login/signup -> vai direto para a app.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/founder";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
