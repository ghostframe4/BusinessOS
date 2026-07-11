"use client";

import type { ReactNode } from "react";
import { useSelectedLayoutSegment } from "next/navigation";

import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { sectionEnum, type Section } from "@/lib/content/schema";

/**
 * Layout persistente do app (docs/04 §3.1, docs/03 §7.1): grid `sidebar | main`.
 * A seção ativa vem do segmento logo abaixo deste layout
 * (`useSelectedLayoutSegment` -> "founder" | "direcao" | ...), destacada na nav.
 * Client component só para ler o segmento; os `children` continuam sendo Server
 * Components renderizados no servidor e repassados como prop.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const segment = useSelectedLayoutSegment();
  const parsed = sectionEnum.safeParse(segment);
  const activeSection: Section | undefined = parsed.success ? parsed.data : undefined;

  return (
    <div className="flex min-h-dvh">
      <Sidebar activeSection={activeSection} />
      <main className="min-w-0 flex-1 bg-content">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-end border-b border-border bg-content/80 px-6 backdrop-blur md:px-8">
          <ThemeToggle />
        </header>
        <div className="mx-auto w-full max-w-[--content-max] px-6 py-6 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
