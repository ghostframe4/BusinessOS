import { Check, X } from "lucide-react";

import { LEAD_STAGE_LABEL, type LeadStage } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

interface StageStyle {
  /** Classes do container do badge. */
  badge: string;
  /** Classes do dot (indicador). */
  dot: string;
  /** Ícone especial no lugar do dot (estados terminais). */
  icon?: "check" | "x";
}

/**
 * Escala de estágio do lead no sistema "Flux" — do outline neutro (novo) ao
 * limão preenchido (ganho), com lavanda pastel para os estágios ativos que
 * pedem atenção. O rótulo pt-BR fica SEMPRE visível — cor/forma nunca é o
 * único sinal (acessibilidade), espelhando o `StatusBadge` das entidades.
 */
const STAGE_STYLE: Record<LeadStage, StageStyle> = {
  new: {
    badge: "border border-dashed border-border bg-transparent text-muted-foreground",
    dot: "border border-muted-foreground/50 bg-transparent",
  },
  contacted: {
    badge: "border border-transparent bg-muted text-foreground",
    dot: "bg-muted-foreground/60",
  },
  qualified: {
    badge: "border border-transparent bg-lavender-muted text-foreground",
    dot: "bg-lavender",
  },
  negotiating: {
    badge: "border border-transparent bg-brand-muted text-foreground",
    dot: "bg-brand",
  },
  won: {
    badge: "border border-transparent bg-brand font-medium text-brand-foreground",
    dot: "bg-brand-foreground",
    icon: "check",
  },
  lost: {
    badge: "border border-border bg-transparent text-muted-foreground/60",
    dot: "bg-muted-foreground/40",
    icon: "x",
  },
};

export interface StageBadgeProps {
  stage: LeadStage;
  className?: string;
}

/** Badge de estágio do funil (sistema Flux) com rótulo pt-BR sempre presente. */
export function StageBadge({ stage, className }: StageBadgeProps) {
  const style = STAGE_STYLE[stage];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs",
        style.badge,
        className,
      )}
    >
      {style.icon === "check" ? (
        <Check className="size-3 shrink-0" aria-hidden />
      ) : style.icon === "x" ? (
        <X className="size-3 shrink-0" aria-hidden />
      ) : (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", style.dot)}
          aria-hidden
        />
      )}
      {LEAD_STAGE_LABEL[stage]}
    </span>
  );
}
