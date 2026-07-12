import { BadgeCheck, CircleHelp, Globe, Sparkles } from "lucide-react";

import { EMAIL_STATUS_LABEL, type EmailStatus } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

interface Style {
  badge: string;
  Icon: typeof Globe;
}

/**
 * Chip da procedência de um e-mail. Deixa explícito, sempre, se o e-mail foi
 * confirmado, é público, foi só inferido do padrão do domínio, ou não existe —
 * para o founder nunca disparar um contato achando que um palpite é certeza.
 */
const STYLE: Record<EmailStatus, Style> = {
  verified: {
    badge: "bg-brand-muted text-foreground",
    Icon: BadgeCheck,
  },
  public: {
    badge: "bg-lavender-muted text-foreground",
    Icon: Globe,
  },
  inferred: {
    badge: "border border-dashed border-border bg-transparent text-muted-foreground",
    Icon: Sparkles,
  },
  unknown: {
    badge: "bg-muted text-muted-foreground",
    Icon: CircleHelp,
  },
};

export interface EmailStatusBadgeProps {
  status: EmailStatus;
  className?: string;
}

/** Badge pill da procedência do e-mail, com rótulo pt-BR sempre visível. */
export function EmailStatusBadge({ status, className }: EmailStatusBadgeProps) {
  const { badge, Icon } = STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem]",
        badge,
        className,
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      {EMAIL_STATUS_LABEL[status]}
    </span>
  );
}
