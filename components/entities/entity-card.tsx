import Link from "next/link";
import { Sparkles } from "lucide-react";

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

export interface EntityCardProps {
  entity: EntityMeta;
  className?: string;
}

/**
 * Card de entidade — variante GRID (docs/03 §7.2).
 * `<article>` com um único `<h3>`; o link do título cobre o card inteiro
 * (`after:absolute inset-0`) para clique total sem aninhar interativos.
 */
export function EntityCard({ entity, className }: EntityCardProps) {
  const href = `/${entity.section}/${entity.entity}`;
  return (
    <article
      className={cn(
        "group relative flex min-h-44 flex-col gap-3 rounded-3xl bg-card p-6 shadow-sm",
        "transition-shadow hover:shadow-md focus-within:shadow-md",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold leading-snug tracking-tight text-card-foreground">
          <Link
            href={href}
            className="rounded-lg outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {entity.title}
          </Link>
        </h3>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={entity.status} />
          {isProposal(entity) && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
              <Sparkles className="size-3 shrink-0" aria-hidden />
              Proposto por IA
            </span>
          )}
        </div>
      </header>

      {entity.summary ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{entity.summary}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground/70">Sem resumo ainda.</p>
      )}

      <footer className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Atualizado {formatUpdated(entity.updated)}</span>
        {entity.tags.length > 0 && (
          <ul className="flex min-w-0 items-center gap-1.5">
            {entity.tags.slice(0, 3).map((tag) => (
              <li key={tag} className="truncate">
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </footer>
    </article>
  );
}
