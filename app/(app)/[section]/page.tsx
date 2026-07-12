import { notFound } from "next/navigation";

import { EntityCardGrid, type EntityView } from "@/components/entities/entity-card-grid";
import { EmptyState } from "@/components/entities/empty-state";
import { ViewToggle } from "@/components/entities/view-toggle";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Topbar } from "@/components/layout/topbar";
import { withUserContext } from "@/lib/content/session";
import { SECTION_LABEL } from "@/lib/content/labels";
import { listEntities } from "@/lib/content/repository";
import { sectionEnum } from "@/lib/content/schema";

export const runtime = "nodejs"; // precisa de fs/DB (lib/content)
// Dados por-usuario (ADR 0001 §Consequencias): render dinamico por sessao. Sem
// `generateStaticParams` — o conteudo do tenant nunca e pre-renderizado no build.
export const dynamic = "force-dynamic";

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
  const entities = await withUserContext(() => listEntities(parsed.data));

  return (
    <>
      <Topbar
        breadcrumb={<Breadcrumb items={[{ label: SECTION_LABEL[parsed.data] }]} />}
      >
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {SECTION_LABEL[parsed.data]}
            </h1>
            <p className="text-sm text-muted-foreground">
              {entities.length > 0
                ? `${entities.length} ${entities.length === 1 ? "entidade" : "entidades"} nesta seção`
                : "Organize as decisões desta seção."}
            </p>
          </div>
          <ViewToggle value={view} />
        </header>
      </Topbar>

      <div className="px-6 pb-10 pt-6 md:px-8">
        {entities.length === 0 ? (
          <EmptyState
            title="Nada por aqui ainda"
            description="Esta seção ainda não tem entidades preenchidas. Assim que houver conteúdo, os cards aparecem aqui."
          />
        ) : (
          <EntityCardGrid entities={entities} view={view} />
        )}
      </div>
    </>
  );
}
