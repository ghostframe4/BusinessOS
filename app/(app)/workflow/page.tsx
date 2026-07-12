import { EmptyState } from "@/components/entities/empty-state";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Topbar } from "@/components/layout/topbar";
import { WorkflowBoard } from "@/components/workflow/workflow-board";
import { ENTITY_AGENT } from "@/lib/content/agent-map";
import { listEntities } from "@/lib/content/repository";
import { withUserContext } from "@/lib/content/session";

export const runtime = "nodejs"; // precisa de fs (lib/content)
export const dynamic = "force-dynamic"; // sempre reflete o disco

export default async function WorkflowPage() {
  const entities = await withUserContext(() => listEntities());

  // Cada entidade carrega quem é o agente responsável; o board deriva o resto.
  const cards = entities
    .filter((e) => e.status !== "archived")
    .map((entity) => ({
      entity,
      agentSlug: ENTITY_AGENT[entity.id] ?? null,
    }));

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Workflow" }]} />}>
        <header className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Workflow
          </h1>
          <p className="text-sm text-muted-foreground">
            Quem está trabalhando em quê — cada card é uma entidade do negócio, e
            o agente responsável fica visível. Arraste os cards entre os estágios;
            propostas da IA param em{" "}
            <span className="font-medium text-foreground">Aguardando você</span>.
          </p>
        </header>
      </Topbar>

      <div className="px-6 pb-10 pt-6 md:px-8">
        {cards.length === 0 ? (
          <EmptyState
            title="Nada no workflow ainda"
            description="Assim que houver entidades em content/, elas aparecem aqui organizadas por estágio."
          />
        ) : (
          <WorkflowBoard initialCards={cards} />
        )}
      </div>
    </>
  );
}
