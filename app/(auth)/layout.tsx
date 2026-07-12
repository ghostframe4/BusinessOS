import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Layout do grupo de autenticacao (login/signup). Minimalista e centralizado,
 * SEM a sidebar do grupo (app). P&B, coerente com o design "Flux": marca no
 * topo, card branco arredondado no centro sobre o canvas off-white.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 md:px-8">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
          >
            B
          </span>
          <span className="text-base font-bold tracking-tight">BusinessOS</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
