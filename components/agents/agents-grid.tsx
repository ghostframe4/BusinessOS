"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { AgentEditor } from "@/components/agents/agent-editor";
import { RobotAvatar } from "@/components/agents/robot-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { agentName } from "@/lib/agents/persona";
import type { AgentDoc } from "@/lib/agents/repository";

/**
 * Grade de agentes com edição em modal. Recebe os docs completos (corpo
 * incluso) para abrir o editor sem round-trip. Cada card mostra um avatar de
 * robozinho único e o nome amigável; clicar abre o `Dialog` com o `AgentEditor`
 * embutido. Ao salvar, fecha e revalida a rota via `router.refresh()`.
 */
export function AgentsGrid({ agents }: { agents: AgentDoc[] }) {
  const router = useRouter();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const active = agents.find((a) => a.slug === openSlug) ?? null;

  function close(): void {
    setOpenSlug(null);
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => {
          const name = agentName(agent.slug);
          return (
            <li key={agent.slug}>
              <button
                type="button"
                onClick={() => setOpenSlug(agent.slug)}
                className="group flex h-full w-full flex-col gap-3 rounded-3xl bg-card p-6 text-left shadow-sm ring-1 ring-transparent transition hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <RobotAvatar slug={agent.slug} size={64} />
                  <Pencil
                    className="size-4 shrink-0 text-muted-foreground/40 transition group-hover:text-foreground"
                    aria-hidden
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-base font-semibold tracking-tight">
                      {name}
                    </h2>
                    <span className="font-mono text-xs text-muted-foreground">
                      {agent.slug}
                    </span>
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {agent.description || "Sem descrição."}
                  </p>
                </div>

                {agent.tools && (
                  <p className="mt-auto pt-1 text-xs text-muted-foreground/80">
                    <span className="font-medium text-muted-foreground">
                      Ferramentas:
                    </span>{" "}
                    <span className="font-mono">{agent.tools}</span>
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={active !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto bg-card">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 text-left">
                  <RobotAvatar slug={active.slug} size={44} />
                  <div className="flex min-w-0 flex-col">
                    <DialogTitle className="flex items-baseline gap-2">
                      {agentName(active.slug)}
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        {active.slug}
                      </span>
                    </DialogTitle>
                    <DialogDescription className="line-clamp-2">
                      {active.description || "Sem descrição."}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <AgentEditor
                agent={active}
                embedded
                onCancel={close}
                onSaved={() => {
                  close();
                  router.refresh();
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
