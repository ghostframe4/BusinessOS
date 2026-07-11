import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** Título curto (ex.: "Nada por aqui ainda"). */
  title?: string;
  /** Descrição que explica o que a seção/entidade guarda. */
  description?: string;
  /** Ícone lucide decorativo. */
  icon?: LucideIcon;
  /** Rótulo do botão de ação (ex.: "Criar oferta"). */
  actionLabel?: string;
  /** Destino da ação; renderiza o botão apenas se junto com `actionLabel`. */
  actionHref?: string;
  className?: string;
}

/**
 * Estado vazio de uma seção/entidade sem conteúdo (docs/03 §9.1).
 * Bloco centralizado com ícone, título, descrição e ação primária opcional.
 */
export function EmptyState({
  title = "Nada por aqui ainda",
  description,
  icon: Icon = Inbox,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-16 text-center shadow-sm",
        className,
      )}
    >
      <span
        className="mb-1 flex size-16 items-center justify-center rounded-full bg-brand-muted"
        aria-hidden
      >
        <Icon className="size-7 text-foreground" />
      </span>
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionHref && actionLabel && (
        <Button asChild className="mt-2">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
