import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface NavItemProps {
  /** Destino do link (ex.: "/direcao"). */
  href: string;
  /** Rótulo visível em pt-BR. */
  label: string;
  /** Ícone lucide (componente). */
  icon: LucideIcon;
  /** Marca o item como a seção ativa (aria-current + pill branca + peso). */
  active?: boolean;
  /** Desabilita a navegação (sem foco, sem ponteiro). */
  disabled?: boolean;
}

/**
 * Item de navegação da sidebar (docs/03 §7.1) — visual "Flux".
 * Server component: apenas um `<Link>` com ícone; sem estado.
 * Ativo = pill branca (`bg-sidebar-accent` + texto escuro + `font-semibold` +
 * `aria-current="page"`). Inativo = texto esmaecido que clareia no hover.
 * O rótulo ocupa o espaço restante (`flex-1`) deixando a linha pronta para um
 * badge de contagem à direita, sem depender de props novas.
 */
export function NavItem({
  href,
  label,
  icon: Icon,
  active = false,
  disabled = false,
}: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-full px-3.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        active
          ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
          : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}
