import { Check } from "lucide-react";

import { STATUS_LABEL } from "@/lib/content/labels";
import type { Status } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

interface StatusStyle {
  /** Classes do container do badge. */
  badge: string;
  /** Classes do dot (indicador). */
  dot: string;
  /** Usa ícone de check no lugar do dot (estado validado). */
  check?: boolean;
}

/**
 * Escala de status no sistema "Flux" — do outline vazio ao limão preenchido
 * (empty < draft < in_progress < needs_review < validated; archived = esmaecido).
 * validated = limão (bg-brand) com check; needs_review = lavanda pastel para
 * chamar atenção da proposta pendente; in_progress = preenchimento neutro suave.
 * O rótulo pt-BR (STATUS_LABEL) fica SEMPRE visível — a cor/forma nunca é o
 * único sinal (acessibilidade).
 */
const STATUS_STYLE: Record<Status, StatusStyle> = {
  empty: {
    badge: "border border-dashed border-border bg-transparent text-muted-foreground",
    dot: "border border-muted-foreground/50 bg-transparent",
  },
  draft: {
    badge: "border border-border bg-transparent text-muted-foreground",
    dot: "border border-muted-foreground/50 bg-transparent",
  },
  in_progress: {
    badge: "border border-transparent bg-muted text-foreground",
    dot: "bg-muted-foreground/60",
  },
  needs_review: {
    badge: "border border-transparent bg-lavender-muted text-foreground",
    dot: "bg-lavender",
  },
  validated: {
    badge: "border border-transparent bg-brand font-medium text-brand-foreground",
    dot: "bg-brand-foreground",
    check: true,
  },
  archived: {
    badge: "border border-border bg-transparent text-muted-foreground/60",
    dot: "bg-muted-foreground/40",
  },
};

export interface StatusBadgeProps {
  status: Status;
  className?: string;
}

/** Badge de status monocromático com rótulo pt-BR sempre presente (docs/03 §7.2). */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs",
        style.badge,
        className,
      )}
    >
      {style.check ? (
        <Check className="size-3 shrink-0" aria-hidden />
      ) : (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", style.dot)}
          aria-hidden
        />
      )}
      {STATUS_LABEL[status]}
    </span>
  );
}
