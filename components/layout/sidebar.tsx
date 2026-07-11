import type { LucideIcon } from "lucide-react";
import { Compass, FlaskConical, User, Wallet } from "lucide-react";

import { NavItem } from "@/components/layout/nav-item";
import { SECTION_LABEL } from "@/lib/content/labels";
import type { Section } from "@/lib/content/schema";
import { sectionEnum } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/** Ícone por seção (camada de apresentação; rótulos vêm de labels/registry). */
const SECTION_ICON: Record<Section, LucideIcon> = {
  founder: User,
  direcao: Compass,
  validacao: FlaskConical,
  caixa: Wallet,
};

export interface SidebarProps {
  /** Seção atualmente ativa (destacada na nav). */
  activeSection?: Section;
  className?: string;
}

/**
 * Sidebar persistente (docs/03 §7.1) — visual "Flux".
 * Painel escuro flutuante: o `<aside>` reserva a largura e cola no topo (sticky),
 * e o `padding` cria a folga ao redor do painel `bg-sidebar rounded-3xl`. Funciona
 * tanto colada quanto flutuante porque o painel é autocontido.
 * Server component: marca com acento limão, navegação das 4 seções (na ordem
 * canônica do `sectionEnum`) e rodapé com meta. Recebe a seção ativa via prop.
 */
export function Sidebar({ activeSection, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 h-dvh w-[--sidebar-width] shrink-0 p-3",
        className,
      )}
    >
      <div className="flex h-full flex-col rounded-3xl bg-sidebar px-4 py-5 text-sidebar-foreground">
        {/* Marca com quadradinho de acento limão. */}
        <div className="flex shrink-0 items-center gap-2.5 px-2 pb-4">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground"
          >
            B
          </span>
          <span className="text-base font-bold tracking-tight">BusinessOS</span>
        </div>

        <nav aria-label="Seções" className="flex-1 space-y-1">
          <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-[0.08em] text-sidebar-muted">
            Seções
          </p>
          {sectionEnum.options.map((section) => (
            <NavItem
              key={section}
              href={`/${section}`}
              label={SECTION_LABEL[section]}
              icon={SECTION_ICON[section]}
              active={section === activeSection}
            />
          ))}
        </nav>

        <footer className="shrink-0 border-t border-sidebar-border px-2 pt-4 text-xs text-sidebar-muted">
          <p className="font-medium text-sidebar-foreground">BusinessOS</p>
          <p>v1.0.0 · conteúdo local</p>
        </footer>
      </div>
    </aside>
  );
}
