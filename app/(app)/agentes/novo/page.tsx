import { AgentCreateForm } from "@/components/agents/agent-create-form";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Topbar } from "@/components/layout/topbar";

export const runtime = "nodejs"; // a action escreve em .claude/agents

export default function NewAgentPage() {
  return (
    <>
      <Topbar
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Agentes", href: "/agentes" },
              { label: "Novo agente" },
            ]}
          />
        }
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Novo agente
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Cria um arquivo em <code>.claude/agents/</code>. Você pode ajustar o
            system prompt depois.
          </p>
        </header>
      </Topbar>

      <div className="flex w-full flex-col gap-8 px-6 pb-10 pt-6 md:px-8">
        <AgentCreateForm />
      </div>
    </>
  );
}
