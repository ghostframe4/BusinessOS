import { ExternalLink, Lightbulb } from "lucide-react";

import { formatSourceHost } from "@/lib/content/report-format";
import type { ReportInsight } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export interface InsightCalloutProps {
  insight: ReportInsight;
  className?: string;
}

/**
 * Callout de insight: bloco lavanda com ícone, a leitura em uma frase e a fonte
 * como link discreto quando o insight se ancora num dado externo.
 */
export function InsightCallout({ insight, className }: InsightCalloutProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl bg-lavender-muted p-5",
        className,
      )}
    >
      <Lightbulb
        className="mt-0.5 size-5 shrink-0 text-foreground/70"
        aria-hidden
      />
      <div className="flex flex-col gap-2">
        <p className="text-sm leading-relaxed text-foreground/90 md:text-base">
          {insight.text}
        </p>
        {insight.source && (
          <a
            href={insight.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 rounded-full text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {insight.source_label ?? formatSourceHost(insight.source)}
            <ExternalLink className="size-3 shrink-0" aria-hidden />
          </a>
        )}
      </div>
    </div>
  );
}
