import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Proxy da raiz (ADR 0001 §4). No Next 16 a convencao `middleware.ts` foi
 * substituida por `proxy.ts` (mesma capacidade). Delega para `updateSession`,
 * que renova a sessao e protege as rotas de app no modo `supabase`. No modo
 * `file` deixa passar tudo (dev sem login).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Roda em todas as rotas EXCETO estaticos do Next e arquivos de imagem. O
   * matcher exclui `_next/static`, `_next/image`, `favicon.ico` e assets
   * comuns — a protecao real (login/publico) vive em `updateSession`.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
};
