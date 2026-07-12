"use client";

import { useState } from "react";
import { Bot, Building2, Calendar, Hash, User } from "lucide-react";
import { toast } from "sonner";

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
  EMAIL_STATUS_LABEL,
  formatCpf,
  onlyDigits,
  type Company,
  type EmailStatus,
  type Person,
} from "@/lib/leads/types";

/** Procedências que o founder pode escolher no formulário. */
const EMAIL_STATUS_OPTIONS: EmailStatus[] = [
  "verified",
  "public",
  "inferred",
  "unknown",
];

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

export interface PersonDetailSheetProps {
  /** Pessoa em foco; `null` fecha o drawer. */
  person: Person | null;
  /** Empresa vinculada (para exibir o vínculo). */
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (person: Person) => void;
}

/**
 * Drawer lateral de um contato (PF): nome, cargo, e-mail + procedência do e-mail,
 * CPF e nota. O vínculo com a empresa é mostrado como referência. O CPF fica em
 * branco por padrão (dado pessoal sensível que os agentes não coletam) — é aqui
 * que o founder o preenche manualmente quando tiver base legítima.
 */
export function PersonDetailSheet({
  person,
  company,
  open,
  onOpenChange,
  onSave,
}: PersonDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {person && (
          <PersonForm
            key={person.id}
            person={person}
            company={company}
            onSave={(updated) => {
              onSave(updated);
              toast.success("Contato atualizado");
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PersonForm({
  person,
  company,
  onSave,
}: {
  person: Person;
  company: Company | null;
  onSave: (person: Person) => void;
}) {
  const [name, setName] = useState(person.name);
  const [role, setRole] = useState(person.role ?? "");
  const [email, setEmail] = useState(person.email ?? "");
  const [emailStatus, setEmailStatus] = useState<EmailStatus>(
    person.emailStatus ?? (person.email ? "inferred" : "unknown"),
  );
  const [cpf, setCpf] = useState(formatCpf(person.cpf) || person.cpf || "");
  const [note, setNote] = useState(person.note ?? "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const cpfDigits = onlyDigits(cpf);
    onSave({
      ...person,
      name: name.trim(),
      role: role.trim() || undefined,
      email: trimmedEmail || undefined,
      emailStatus: trimmedEmail ? emailStatus : "unknown",
      cpf: cpfDigits || undefined,
      note: note.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <SheetHeader className="gap-2 pr-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
            <User className="size-3 shrink-0" aria-hidden />
            Pessoa
          </span>
        </div>
        <SheetTitle className="text-2xl">{name || "Contato sem nome"}</SheetTitle>
        <SheetDescription>
          {[role, company?.name].filter(Boolean).join(" · ") ||
            "Sem cargo/empresa"}
        </SheetDescription>
      </SheetHeader>

      {/* Origem + vínculo (referência, não editável). */}
      <dl className="mt-4 grid grid-cols-1 gap-2 rounded-2xl bg-muted/50 p-4 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="size-3.5 shrink-0" aria-hidden />
          <span>Empresa</span>
          <span className="ml-auto text-foreground">
            {company?.name ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Bot className="size-3.5 shrink-0" aria-hidden />
          <span>Encontrado por</span>
          <span className="ml-auto font-mono text-foreground">
            {person.foundBy ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="size-3.5 shrink-0" aria-hidden />
          <span>Entrou em</span>
          <span className="ml-auto text-foreground">
            {formatDate(person.addedAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="size-3.5 shrink-0" aria-hidden />
          <span>ID</span>
          <span className="ml-auto font-mono text-foreground">{person.id}</span>
        </div>
      </dl>

      {/* Campos editáveis. */}
      <div className="mt-5 flex flex-col gap-4">
        <Field label="Nome" htmlFor="person-name">
          <Input
            id="person-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Cargo" htmlFor="person-role">
          <Input
            id="person-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="ex.: Diretor de Inovação"
          />
        </Field>

        <Field label="E-mail" htmlFor="person-email">
          <Input
            id="person-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@empresa.com.br"
          />
        </Field>

        <Field label="Procedência do e-mail" htmlFor="person-email-status">
          <Select
            value={emailStatus}
            onValueChange={(v) => setEmailStatus(v as EmailStatus)}
          >
            <SelectTrigger id="person-email-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {EMAIL_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="CPF" htmlFor="person-cpf">
          <Input
            id="person-cpf"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            placeholder="000.000.000-00 (opcional)"
            inputMode="numeric"
          />
          <p className="text-xs text-muted-foreground">
            Dado pessoal — preencha só com base legítima. Os agentes não coletam
            CPF.
          </p>
        </Field>

        <Field label="Nota" htmlFor="person-note">
          <Textarea
            id="person-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contexto, como abordar, próximo passo…"
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
