import { notFound } from "next/navigation";

import { AgentEditor } from "@/components/agents/agent-editor";
import { RobotAvatar } from "@/components/agents/robot-avatar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Topbar } from "@/components/layout/topbar";
import { agentName } from "@/lib/agents/persona";
import { findAgent } from "@/lib/agents/repository";

export const runtime = "nodejs"; // precisa de fs (.claude/agents)
export const dynamic = "force-dynamic"; // sempre reflete o disco

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let agent;
  try {
    agent = await findAgent(slug);
  } catch {
    notFound(); // slug inválido (path traversal etc.)
  }
  if (!agent) notFound();

  return (
    <>
      <Topbar
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Agentes", href: "/agentes" },
              { label: agent.slug },
            ]}
          />
        }
      >
        <header className="flex min-w-0 items-center gap-4">
          <RobotAvatar slug={agent.slug} size={56} />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="flex items-baseline gap-3 text-3xl font-bold tracking-tight md:text-4xl">
              {agentName(agent.slug)}
              <span className="font-mono text-base font-normal text-muted-foreground">
                {agent.slug}
              </span>
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {agent.description || "Sem descrição."}
            </p>
          </div>
        </header>
      </Topbar>

      <div className="flex w-full flex-col gap-8 px-6 pb-10 pt-6 md:px-8">
        <AgentEditor agent={agent} />
      </div>
    </>
  );
}
