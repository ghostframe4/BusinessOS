import { EntityCard } from "@/components/entities/entity-card";
import { EntityCardRow } from "@/components/entities/entity-card-row";
import type { EntityMeta } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export type EntityView = "grid" | "list";

export interface EntityCardGridProps {
  entities: EntityMeta[];
  view: EntityView;
  className?: string;
}

/**
 * Container que renderiza as entidades no layout certo conforme `view`:
 * grid responsivo de cards ou lista densa de linhas (docs/03 §7.2).
 * Puro de apresentação — o estado vazio fica a cargo da page (EmptyState).
 */
export function EntityCardGrid({ entities, view, className }: EntityCardGridProps) {
  if (view === "list") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        {entities.map((entity) => (
          <EntityCardRow key={entity.id} entity={entity} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {entities.map((entity) => (
        <EntityCard key={entity.id} entity={entity} />
      ))}
    </div>
  );
}
