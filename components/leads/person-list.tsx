"use client";

import { useMemo, useState } from "react";
import { Mail, User } from "lucide-react";

import { EmailStatusBadge } from "@/components/leads/email-status-badge";
import { PersonDetailSheet } from "@/components/leads/person-detail-sheet";
import { formatCpf, type Company, type Person } from "@/lib/leads/types";
import { cn } from "@/lib/utils";

export interface PersonListProps {
  people: Person[];
  /** Empresas — usado para resolver o nome da empresa de cada contato. */
  companies: Company[];
}

/** Formata a data ISO (YYYY-MM-DD) em pt-BR curto (dd/mm). */
function shortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return day && month ? `${day}/${month}` : iso;
}

/**
 * Lista de contatos (PF) do CRM em cards clicáveis. Cada card traz nome, cargo,
 * a empresa a que pertence, o e-mail com a procedência (público / inferido /
 * verificado) e o CPF quando houver. O clique abre o drawer de edição. As
 * edições ficam em estado local (persistência é futura).
 */
export function PersonList({ people: initialPeople, companies }: PersonListProps) {
  const [people, setPeople] = useState(initialPeople);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const companyById = useMemo(() => {
    const map = new Map<string, Company>();
    for (const c of companies) map.set(c.id, c);
    return map;
  }, [companies]);

  const selected = people.find((p) => p.id === selectedId) ?? null;
  const selectedCompany =
    selected?.companyId != null
      ? companyById.get(selected.companyId) ?? null
      : null;

  function openPerson(id: string) {
    setSelectedId(id);
    setOpen(true);
  }

  function savePerson(updated: Person) {
    setPeople((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {people.map((person) => {
          const company =
            person.companyId != null
              ? companyById.get(person.companyId)
              : undefined;
          const cpf = formatCpf(person.cpf);
          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => openPerson(person.id)}
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
                  <User className="size-5" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-semibold text-card-foreground">
                      {person.name}
                    </span>
                    {person.role && (
                      <span className="text-xs text-muted-foreground">
                        {person.role}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    {company && (
                      <span className="text-foreground/80">{company.name}</span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3 shrink-0" aria-hidden />
                      {person.email ?? "sem e-mail"}
                    </span>
                    <EmailStatusBadge status={person.emailStatus ?? "unknown"} />
                  </div>
                </div>

                {/* Documento (PF) — CPF quando houver. */}
                <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                  <span className="text-[0.7rem] uppercase tracking-wide text-muted-foreground/70">
                    CPF
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {cpf || "—"}
                  </span>
                </div>

                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {shortDate(person.addedAt)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <PersonDetailSheet
        person={selected}
        company={selectedCompany}
        open={open}
        onOpenChange={setOpen}
        onSave={savePerson}
      />
    </>
  );
}
