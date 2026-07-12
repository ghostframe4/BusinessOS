"use client";

import { Building2, User } from "lucide-react";

import { CompanyList } from "@/components/leads/company-list";
import { PersonList } from "@/components/leads/person-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Company, Person } from "@/lib/leads/types";

export interface LeadsWorkspaceProps {
  companies: Company[];
  people: Person[];
}

/**
 * Área principal do CRM com a alternância Empresas (PJ) ↔ Pessoas (PF). A aba
 * de empresas filtra pelo cadastro jurídico (CNPJ); a de pessoas, pelos
 * contatos (CPF/e-mail). Cada aba mostra a própria contagem.
 */
export function LeadsWorkspace({ companies, people }: LeadsWorkspaceProps) {
  return (
    <Tabs defaultValue="companies" className="flex flex-col gap-4">
      <TabsList aria-label="Alternar entre empresas e pessoas">
        <TabsTrigger value="companies">
          <Building2 className="size-4 shrink-0" aria-hidden />
          Empresas
          <span className="tabular-nums text-muted-foreground">
            {companies.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="people">
          <User className="size-4 shrink-0" aria-hidden />
          Pessoas
          <span className="tabular-nums text-muted-foreground">
            {people.length}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="companies">
        {companies.length === 0 ? (
          <EmptyTab label="Nenhuma empresa cadastrada ainda." />
        ) : (
          <CompanyList companies={companies} people={people} />
        )}
      </TabsContent>

      <TabsContent value="people">
        {people.length === 0 ? (
          <EmptyTab label="Nenhum contato cadastrado ainda." />
        ) : (
          <PersonList people={people} companies={companies} />
        )}
      </TabsContent>
    </Tabs>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
      {label}
    </p>
  );
}
