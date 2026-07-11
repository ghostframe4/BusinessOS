import { notFound } from "next/navigation";

import { EntityCardGrid, type EntityView } from "@/components/entities/entity-card-grid";
import { EmptyState } from "@/components/entities/empty-state";
import { ViewToggle } from "@/components/entities/view-toggle";
import { SECTION_LABEL } from "@/lib/content/labels";
import { listEntities } from "@/lib/content/repository";
import { sectionEnum } from "@/lib/content/schema";

export const runtime = "nodejs"; // precisa de fs (lib/content)
export const dynamic = "force-dynamic"; // sempre reflete o disco (round-trip fiel)

/** Materializa as 4 seções como rotas estáticas (docs/04 §3.2). */
export function generateStaticParams() {
  return sectionEnum.options.map((section) => ({ section }));
}

/** Normaliza o search param `?view` para uma visualização válida (default: grade). */
function resolveView(raw: string | undefined): EntityView {
  return raw === "list" ? "list" : "grid";
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { section } = await params;
  const parsed = sectionEnum.safeParse(section);
  if (!parsed.success) notFound();

  const { view: viewParam } = await searchParams;
  const view = resolveView(viewParam);
  const entities = await listEntities(parsed.data);

  return (
    <div className="flex flex-col">
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {SECTION_LABEL[parsed.data]}
        </h1>
        <ViewToggle value={view} />
      </header>

      {entities.length === 0 ? (
        <EmptyState
          title="Nada por aqui ainda"
          description="Esta seção ainda não tem entidades preenchidas. Assim que houver conteúdo, os cards aparecem aqui."
        />
      ) : (
        <EntityCardGrid entities={entities} view={view} />
      )}
    </div>
  );
}
