import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

export interface TopbarProps {
  /** Conteúdo da faixa fixa (ex.: `Breadcrumb`), alinhado à esquerda. */
  breadcrumb?: ReactNode;
  /** Bloco de título/meta abaixo da faixa; rola com a página. */
  children?: ReactNode;
  className?: string;
}

/**
 * Topbar full-width do app (docs/03 §7.1): faixa superior com a trilha de
 * navegação à esquerda e o alternador de tema à direita, mais um bloco de
 * título/meta logo abaixo.
 *
 * Só a faixa é `sticky` — o breadcrumb e o toggle permanecem visíveis ao rolar,
 * enquanto o título grande sai de cena. Barra e bloco são irmãos no fluxo (não
 * um pai sticky) para que apenas a faixa gruda no topo.
 */
export function Topbar({ breadcrumb, children, className }: TopbarProps) {
  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur",
          className,
        )}
      >
        <div className="flex h-14 items-center justify-between gap-3 px-6 md:px-8">
          <div className="min-w-0">{breadcrumb}</div>
          <ThemeToggle />
        </div>
      </div>

      {children && (
        <div className="px-6 pb-2 pt-6 md:px-8">{children}</div>
      )}
    </>
  );
}
