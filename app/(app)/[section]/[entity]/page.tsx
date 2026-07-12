import { notFound } from "next/navigation";

import { AskAi } from "@/components/entities/ask-ai";
import { EditEntityDialog } from "@/components/entities/edit-entity-dialog";
import { EntityReport } from "@/components/entities/entity-report";
import { GenerateReport } from "@/components/entities/generate-report";
import { ProposalBar } from "@/components/entities/proposal-bar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Topbar } from "@/components/layout/topbar";
import { AI_ENABLED } from "@/lib/config";
import { ENTITY_AGENT, isProposal } from "@/lib/content/agent-map";
import { SECTION_LABEL } from "@/lib/content/labels";
import { getEntityDef } from "@/lib/content/registry";
import { readEntity } from "@/lib/content/repository";
import { withUserContext } from "@/lib/content/session";

export const runtime = "nodejs"; // precisa de fs (lib/content)
export const dynamic = "force-dynamic"; // sempre reflete o disco

export default async function EntityPage({
  params,
}: {
  params: Promise<{ section: string; entity: string }>;
}) {
  const { section, entity } = await params;
  const id = `${section}/${entity}`;

  const def = getEntityDef(id);
  if (!def) notFound(); // id fora do REGISTRY

  const doc = await withUserContext(() => readEntity(id));
  const fm = doc.frontmatter;
  const agentSlug = ENTITY_AGENT[id] ?? null;

  return (
    <>
      <Topbar
        breadcrumb={
          <Breadcrumb
            items={[
              { label: SECTION_LABEL[def.section], href: `/${def.section}` },
              { label: fm.title },
            ]}
          />
        }
      >
        {/* Barra de ações do relatório: ler/aprovar é o padrão; editar e gerar
            dados são ações secundárias. O título/summary vivem no hero do report. */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AskAi
            id={id}
            title={fm.title}
            agentSlug={agentSlug}
            aiEnabled={AI_ENABLED}
          />
          <GenerateReport
            id={id}
            title={fm.title}
            agentSlug={agentSlug}
            aiEnabled={AI_ENABLED}
          />
          <EditEntityDialog doc={doc} aiEnabled={AI_ENABLED} />
        </div>
      </Topbar>

      <div className="flex w-full flex-col gap-8 px-6 pb-10 pt-4 md:px-8">
        {isProposal(fm) && (
          <ProposalBar
            id={id}
            baseRevision={fm.revision}
            agentSlug={fm.last_edited_by.replace("agent:", "")}
          />
        )}

        <EntityReport doc={doc} />
      </div>
    </>
  );
}
