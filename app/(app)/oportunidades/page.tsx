import { Target } from "lucide-react";

import { EmptyState } from "@/components/entities/empty-state";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Topbar } from "@/components/layout/topbar";
import { OpportunitiesBoard } from "@/components/leads/opportunities-board";
import { listCompanies } from "@/lib/leads/data";

export const dynamic = "force-dynamic"; // reflete a base à medida que os agentes populam

export default function OportunidadesPage() {
  const companies = listCompanies();

  return (
    <>
      <Topbar breadcrumb={<Breadcrumb items={[{ label: "Oportunidades" }]} />}>
        <header className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Oportunidades
          </h1>
          <p className="text-sm text-muted-foreground">
            O funil das suas{" "}
            <span className="font-medium text-foreground">empresas</span> em
            kanban. Cada card é uma oportunidade caminhando do primeiro contato
            até o fechamento — arraste-as entre as colunas conforme avançam.
          </p>
        </header>
      </Topbar>

      <div className="px-6 pb-10 pt-6 md:px-8">
        {companies.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma oportunidade ainda"
            description="Quando os agentes de prospecção trouxerem empresas, elas aparecem aqui organizadas por estágio do funil — prontas para você trabalhar até o fechamento."
          />
        ) : (
          <OpportunitiesBoard initialCompanies={companies} />
        )}
      </div>
    </>
  );
}
