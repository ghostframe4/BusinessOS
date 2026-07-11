import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

import { StatusBadge } from "@/components/entities/status-badge";
import { isProposal } from "@/lib/content/agent-map";
import type { EntityMeta } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

/** Formata uma data ISO para pt-BR (ex.: "11 de jul. de 2026"). */
function formatUpdated(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export interface EntityCardRowProps {
  entity: EntityMeta;
  className?: string;
}

/**
 * Card de entidade — variante LISTA (docs/03 §7.2).
 * Linha densa, largura total, mesma informação na horizontal. O link do título
 * cobre a linha inteira (`after:absolute inset-0`).
 */
export function EntityCardRow({ entity, className }: EntityCardRowProps) {
  const href = `/${entity.section}/${entity.entity}`;
  return (
    <article
      className={cn(
        "group relative flex items-center gap-4 rounded-2xl bg-card px-5 py-3.5 shadow-sm",
        "transition-shadow hover:shadow-md focus-within:shadow-md",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-card-foreground">
          <Link
            href={href}
            className="rounded-lg outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {entity.title}
          </Link>
        </h3>
        {entity.summary && (
          <p className="truncate text-xs text-muted-foreground">{entity.summary}</p>
        )}
      </div>

      {isProposal(entity) && (
        <span className="hidden shrink-0 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground sm:inline-flex">
          <Sparkles className="size-3 shrink-0" aria-hidden />
          Proposto por IA
        </span>
      )}
      <span className="hidden shrink-0 text-xs text-muted-foreground lg:block">
        {formatUpdated(entity.updated)}
      </span>
      <StatusBadge status={entity.status} className="shrink-0" />
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </article>
  );
}
