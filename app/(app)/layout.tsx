"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { sectionEnum, type Section } from "@/lib/content/schema";

/**
 * Layout persistente do app (docs/04 §3.1, docs/03 §7.1): grid `sidebar | main`.
 * A seção ativa vem do segmento logo abaixo deste layout
 * (`useSelectedLayoutSegment` -> "founder" | "direcao" | ...), destacada na nav.
 * Client component só para ler o segmento; os `children` continuam sendo Server
 * Components renderizados no servidor e repassados como prop.
 *
 * O `main` é full-width: cada página monta seu próprio `Topbar` (com o
 * alternador de tema) e controla o padding do conteúdo.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const parsed = sectionEnum.safeParse(segment);
  const activeSection: Section | undefined = parsed.success ? parsed.data : undefined;

  return (
    // overflow-x-clip (na raiz, borda x=0) contém o deslize da gaveta de
    // conversas (animate-drawer-in parte de translateX(-100%)) sem cortar a
    // sobreposição dela sob a sidebar nem criar scroll horizontal — e, por não
    // ser `hidden`, não força overflow-y e preserva o `sticky` das colunas.
    <div className="flex min-h-dvh overflow-x-clip bg-background">
      <Sidebar activeSection={activeSection} activeSegment={segment ?? undefined} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
