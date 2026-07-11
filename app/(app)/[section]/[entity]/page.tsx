import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { AskAi } from "@/components/entities/ask-ai";
import { EntityForm } from "@/components/entities/entity-form";
import { ProposalBar } from "@/components/entities/proposal-bar";
import { ENTITY_AGENT, isProposal } from "@/lib/content/agent-map";
import { SECTION_LABEL } from "@/lib/content/labels";
import { getEntityDef } from "@/lib/content/registry";
import { readEntity } from "@/lib/content/repository";

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

  const doc = await readEntity(id);
  const fm = doc.frontmatter;
  const agentSlug = ENTITY_AGENT[id] ?? null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${def.section}`}
          className="inline-flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {SECTION_LABEL[def.section]}
        </Link>

        <AskAi id={id} title={fm.title} agentSlug={agentSlug} />
      </div>

      {isProposal(fm) && (
        <ProposalBar
          id={id}
          baseRevision={fm.revision}
          agentSlug={fm.last_edited_by.replace("agent:", "")}
        />
      )}

      <EntityForm doc={doc} />
    </div>
  );
}
