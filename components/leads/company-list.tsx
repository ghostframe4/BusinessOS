"use client";

import { useState } from "react";
import { Bot, Building2, MapPin, Users } from "lucide-react";

import { CompanyDetailSheet } from "@/components/leads/company-detail-sheet";
import { StageBadge } from "@/components/leads/stage-badge";
import { formatCnpj, type Company, type Person } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

export interface CompanyListProps {
  companies: Company[];
  /** Todas as pessoas — usado para contar/mostrar contatos por empresa. */
  people: Person[];
}

/** Formata a data ISO (YYYY-MM-DD) em pt-BR curto (dd/mm). */
function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return day && month ? `${day}/${month}` : iso;
}

/** Cor do preenchimento da barra de fit. */
function scoreTone(score: number): string {
  if (score >= 80) return "bg-brand";
  if (score >= 60) return "bg-lavender";
  return "bg-muted-foreground/40";
}

/**
 * Lista de empresas (PJ) do CRM em cards clicáveis. Cada card traz nome, setor
 * + cidade, CNPJ, porte, o fit com a oferta, o estágio no funil e quantos
 * contatos a empresa tem. O clique abre o drawer com os dados cadastrais e a
 * lista de contatos. As edições ficam em estado local (persistência é futura).
 */
export function CompanyList({
  companies: initialCompanies,
  people,
}: CompanyListProps) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const selected = companies.find((c) => c.id === selectedId) ?? null;
  const selectedContacts = selected
    ? people.filter((p) => p.companyId === selected.id)
    : [];

  function openCompany(id: string) {
    setSelectedId(id);
    setOpen(true);
  }

  function saveCompany(updated: Company) {
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {companies.map((company) => {
          const contactCount = people.filter(
            (p) => p.companyId === company.id,
          ).length;
          const cnpj = formatCnpj(company.cnpj);
          return (
            <li key={company.id}>
              <button
                type="button"
                onClick={() => openCompany(company.id)}
                aria-haspopup="dialog"
                className={cn(
                  "group flex w-full items-center gap-4 rounded-2xl bg-card px-5 py-4 text-left shadow-sm",
                  "ring-1 ring-transparent transition hover:shadow-md hover:ring-border",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span
                  className="hidden size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground sm:flex"
                  aria-hidden
                >
                  <Building2 className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-card-foreground">
                      {company.name}
                    </span>
                    {company.sector && (
                      <span className="text-xs text-muted-foreground">
                        {company.sector}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {company.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3 shrink-0" aria-hidden />
                        {company.city}
                      </span>
                    )}
                    {cnpj && (
                      <>
                        <span aria-hidden className="text-muted-foreground/40">
                          ·
                        </span>
                        <span className="font-mono">CNPJ {cnpj}</span>
                      </>
                    )}
                    <span aria-hidden className="text-muted-foreground/40">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3 shrink-0" aria-hidden />
                      {contactCount}{" "}
                      {contactCount === 1 ? "contato" : "contatos"}
                    </span>
                    {company.foundBy && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground/80">
                        <Bot className="size-3 shrink-0" aria-hidden />
                        <span className="font-mono">{company.foundBy}</span>
                      </span>
                    )}
                  </div>
                  {company.note && (
                    <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
                      {company.note}
                    </p>
                  )}
                </div>

                {typeof company.score === "number" && (
                  <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      fit {company.score}
                    </span>
                    <span
                      className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
                      aria-hidden
                    >
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          scoreTone(company.score),
                        )}
                        style={{ width: `${company.score}%` }}
                      />
                    </span>
                  </div>
                )}

                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <StageBadge stage={company.stage} />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {shortDate(company.addedAt)}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <CompanyDetailSheet
        company={selected}
        contacts={selectedContacts}
        open={open}
        onOpenChange={setOpen}
        onSave={saveCompany}
      />
    </>
  );
}
