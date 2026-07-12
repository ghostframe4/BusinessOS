import { AgentsGrid } from "@/components/agents/agents-grid";
import { NewAgentButton } from "@/components/agents/new-agent-button";
import { EmptyState } from "@/components/entities/empty-state";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Topbar } from "@/components/layout/topbar";
import { listAgents, readAgent } from "@/lib/agents/repository";

export const runtime = "nodejs"; // precisa de fs (.claude/agents)
export const dynamic = "force-dynamic"; // sempre reflete o disco

export default async function AgentsPage() {
  const metas = await listAgents();
  // Carrega os docs completos (corpo incluso) para o modal editar sem round-trip.
  const agents = await Promise.all(metas.map((m) => readAgent(m.slug)));

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Agentes" }]} />}>
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Agentes
            </h1>
            <p className="text-sm text-muted-foreground">
              {agents.length > 0
                ? `${agents.length} ${agents.length === 1 ? "agente" : "agentes"} — edite o system prompt de cada um.`
                : "Nenhum agente configurado."}
            </p>
          </div>
          <NewAgentButton />
        </header>
      </Topbar>

      <div className="px-6 pb-10 pt-6 md:px-8">
        {agents.length === 0 ? (
          <EmptyState
            title="Nenhum agente"
            description="Os subagentes ficam em .claude/agents/*.md. Crie o primeiro para começar."
            actionLabel="Novo agente"
            actionHref="/agentes/novo"
          />
        ) : (
          <AgentsGrid agents={agents} />
        )}
      </div>
    </>
  );
}
