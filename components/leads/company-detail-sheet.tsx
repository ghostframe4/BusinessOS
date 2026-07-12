"use client";

import { useState } from "react";
import { Bot, Building2, Calendar, Hash, Mail } from "lucide-react";
import { toast } from "sonner";

import { EmailStatusBadge } from "@/components/leads/email-status-badge";
import { StageBadge } from "@/components/leads/stage-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  formatCnpj,
  LEAD_STAGE_LABEL,
  LEAD_STAGES,
  onlyDigits,
  type Company,
  type LeadStage,
  type Person,
} from "@/lib/leads/types";

/** Formata a data ISO (YYYY-MM-DD) em pt-BR longo. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export interface CompanyDetailSheetProps {
  /** Empresa em foco; `null` fecha o drawer. */
  company: Company | null;
  /** Contatos (pessoas) desta empresa. */
  contacts: Person[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Persiste (por ora, em memória) as edições manuais do founder. */
  onSave: (company: Company) => void;
}

/**
 * Drawer lateral de uma empresa (PJ): dados cadastrais editáveis (nome, razão
 * social, CNPJ, setor, cidade, porte, site, fonte, fit, estágio, nota) + a lista
 * de contatos (pessoas) vinculados, cada um com o e-mail e a procedência dele.
 */
export function CompanyDetailSheet({
  company,
  contacts,
  open,
  onOpenChange,
  onSave,
}: CompanyDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {company && (
          <CompanyForm
            key={company.id}
            company={company}
            contacts={contacts}
            onSave={(updated) => {
              onSave(updated);
              toast.success("Empresa atualizada");
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CompanyForm({
  company,
  contacts,
  onSave,
}: {
  company: Company;
  contacts: Person[];
  onSave: (company: Company) => void;
}) {
  const [name, setName] = useState(company.name);
  const [legalName, setLegalName] = useState(company.legalName ?? "");
  const [cnpj, setCnpj] = useState(formatCnpj(company.cnpj) || company.cnpj || "");
  const [sector, setSector] = useState(company.sector ?? "");
  const [city, setCity] = useState(company.city ?? "");
  const [size, setSize] = useState(company.size ?? "");
  const [website, setWebsite] = useState(company.website ?? "");
  const [source, setSource] = useState(company.source);
  const [stage, setStage] = useState<LeadStage>(company.stage);
  const [score, setScore] = useState(
    typeof company.score === "number" ? String(company.score) : "",
  );
  const [note, setNote] = useState(company.note ?? "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedScore = score.trim() === "" ? undefined : Number(score);
    const cnpjDigits = onlyDigits(cnpj);
    onSave({
      ...company,
      name: name.trim(),
      legalName: legalName.trim() || undefined,
      cnpj: cnpjDigits || undefined,
      sector: sector.trim() || undefined,
      city: city.trim() || undefined,
      size: size.trim() || undefined,
      website: website.trim() || undefined,
      source: source.trim(),
      stage,
      score:
        parsedScore === undefined || Number.isNaN(parsedScore)
          ? undefined
          : Math.max(0, Math.min(100, parsedScore)),
      note: note.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <SheetHeader className="gap-2 pr-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            <Building2 className="size-3 shrink-0" aria-hidden />
            Empresa
          </span>
          <StageBadge stage={stage} />
        </div>
        <SheetTitle className="text-2xl">{name || "Empresa sem nome"}</SheetTitle>
        <SheetDescription>
          {[sector, city].filter(Boolean).join(" · ") || "Sem setor/cidade"}
        </SheetDescription>
      </SheetHeader>

      {/* Origem (referência, não editável). */}
      <dl className="mt-4 grid grid-cols-1 gap-2 rounded-2xl bg-muted/50 p-4 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bot className="size-3.5 shrink-0" aria-hidden />
          <span>Encontrada por</span>
          <span className="ml-auto font-mono text-foreground">
            {company.foundBy ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" aria-hidden />
          <span>Entrou em</span>
          <span className="ml-auto text-foreground">
            {formatDate(company.addedAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="size-3.5 shrink-0" aria-hidden />
          <span>ID</span>
          <span className="ml-auto font-mono text-foreground">{company.id}</span>
        </div>
      </dl>

      {/* Contatos vinculados. */}
      <section className="mt-5 flex flex-col gap-2">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Contatos ({contacts.length})
        </h3>
        {contacts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 px-4 py-3 text-center text-xs text-muted-foreground">
            Nenhum contato vinculado ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {contacts.map((person) => (
              <li
                key={person.id}
                className="flex flex-col gap-1 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border/60"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{person.name}</span>
                  {person.role && (
                    <span className="text-xs text-muted-foreground">
                      {person.role}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3 shrink-0" aria-hidden />
                    {person.email ?? "sem e-mail"}
                  </span>
                  <EmailStatusBadge status={person.emailStatus ?? "unknown"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Campos editáveis. */}
      <div className="mt-5 flex flex-col gap-4">
        <Field label="Nome fantasia" htmlFor="company-name">
          <Input
            id="company-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Razão social" htmlFor="company-legal">
          <Input
            id="company-legal"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="ex.: Empresa Exemplo S.A."
          />
        </Field>

        <Field label="CNPJ" htmlFor="company-cnpj">
          <Input
            id="company-cnpj"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Setor" htmlFor="company-sector">
            <Input
              id="company-sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="ex.: Indústria"
            />
          </Field>

          <Field label="Cidade" htmlFor="company-city">
            <Input
              id="company-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="ex.: Belo Horizonte"
            />
          </Field>
        </div>

        <Field label="Porte" htmlFor="company-size">
          <Input
            id="company-size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="ex.: 100–500 funcionários"
          />
        </Field>

        <Field label="Site" htmlFor="company-website">
          <Input
            id="company-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="empresa.com.br"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fonte" htmlFor="company-source">
            <Input
              id="company-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="ex.: LinkedIn"
            />
          </Field>

          <Field label="Fit (0–100)" htmlFor="company-score">
            <Input
              id="company-score"
              type="number"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="—"
            />
          </Field>
        </div>

        <Field label="Estágio" htmlFor="company-stage">
          <Select value={stage} onValueChange={(v) => setStage(v as LeadStage)}>
            <SelectTrigger id="company-stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {LEAD_STAGE_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Nota" htmlFor="company-note">
          <Textarea
            id="company-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Por que é um bom lead, próximo passo…"
          />
        </Field>
      </div>

      <div className="mt-auto flex items-center justify-end gap-2 pt-6">
        <Button type="submit" variant="brand">
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
