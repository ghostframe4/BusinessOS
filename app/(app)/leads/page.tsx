import { Users } from "lucide-react";

import { EmptyState } from "@/components/entities/empty-state";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Topbar } from "@/components/layout/topbar";
import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import { listCompanies, listPeople } from "@/lib/leads/data";
import { countByStage, LEAD_STAGE_LABEL } from "@/lib/leads/types";

export const dynamic = "force-dynamic"; // reflete a base à medida que os agentes populam

/** KPIs destacados no topo — os estágios que o founder mais acompanha. */
const KPI_STAGES = ["new", "qualified", "negotiating", "won"] as const;

export default function LeadsPage() {
  const companies = listCompanies();
  const people = listPeople();
  const counts = countByStage(companies);
  const isEmpty = companies.length === 0 && people.length === 0;

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Leads" }]} />}>
        <header className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Leads
          </h1>
          <p className="text-sm text-muted-foreground">
            Mini CRM da prospecção. Os{" "}
            <span className="font-medium text-foreground">agentes</span>{" "}
            encontram <span className="font-medium text-foreground">empresas</span>{" "}
            (PJ) e seus <span className="font-medium text-foreground">contatos</span>{" "}
            (PF) na internet e depositam aqui para você qualificar e trabalhar no
            funil.
          </p>
        </header>
      </Topbar>

      <div className="flex flex-col gap-6 px-6 pb-10 pt-6 md:px-8">
        {/* Faixa de KPIs por estágio (sobre as empresas/oportunidades). */}
        <section
          aria-label="Resumo do funil"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {KPI_STAGES.map((stage) => (
            <div
              key={stage}
              className="flex flex-col gap-1 rounded-xl bg-card p-4 shadow-sm"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {LEAD_STAGE_LABEL[stage]}
              </span>
              <span className="text-3xl font-bold tabular-nums tracking-tight">
                {counts[stage]}
              </span>
            </div>
          ))}
        </section>

        {/* Abas Empresas | Pessoas (ou vazio, até os agentes popularem). */}
        {isEmpty ? (
          <EmptyState
            icon={Users}
            title="Nenhum lead ainda"
            description="Quando os agentes de prospecção rodarem, as empresas e contatos encontrados aparecem aqui — prontos para você qualificar."
          />
        ) : (
          <LeadsWorkspace companies={companies} people={people} />
        )}
      </div>
    </>
  );
}
