import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Logout (ADR 0001 §4). Encerra a sessao no Supabase (limpa os cookies via
 * `@supabase/ssr`) e redireciona para `/login`. Chamado por POST a partir do
 * botao "Sair" no menu de usuario da sidebar. 303 converte POST -> GET.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
