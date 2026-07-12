/**
 * Modelo do mini CRM. O CRM separa dois tipos de registro, ligados entre si:
 *
 *  - `Company` (PJ) — a organização/oportunidade. Carrega o CNPJ (dado público),
 *    o estágio no funil e o fit com a oferta. É o que anda no kanban.
 *  - `Person`  (PF) — um contato/tomador de decisão dentro de uma empresa.
 *    Carrega cargo, e-mail (com a procedência do e-mail) e, opcionalmente, CPF.
 *
 * Uma empresa tem 1+ contatos; um contato aponta para a empresa via `companyId`.
 * Os agentes de prospecção descobrem esses registros na internet e depositam
 * aqui para o founder qualificar. Persistência = `data/leads.json`, lido no
 * servidor por `lib/leads/data.ts` (este arquivo é puro e seguro no client).
 *
 * Nota sobre dados pessoais: CNPJ de empresa é público. CPF de pessoa física é
 * dado pessoal sensível — os agentes NÃO o coletam; o campo existe só para o
 * founder preencher manualmente quando tiver base legítima.
 */

/** Estágios do funil, na ordem em que uma oportunidade caminha. */
export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "negotiating"
  | "won"
  | "lost";

/** Ordem canônica dos estágios (para colunas/KPIs). */
export const LEAD_STAGES: LeadStage[] = [
  "new",
  "contacted",
  "qualified",
  "negotiating",
  "won",
  "lost",
];

/** Rótulos pt-BR dos estágios. */
export const LEAD_STAGE_LABEL: Record<LeadStage, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  negotiating: "Em negociação",
  won: "Ganho",
  lost: "Perdido",
};

/**
 * Procedência de um e-mail — o CRM nunca apresenta um e-mail inferido como se
 * fosse confirmado. `public` = achado numa fonte pública (site/institucional);
 * `inferred` = deduzido do padrão do domínio (ex.: nome.sobrenome@empresa.com),
 * a confirmar; `verified` = validado pelo founder; `unknown` = sem e-mail.
 */
export type EmailStatus = "verified" | "public" | "inferred" | "unknown";

/** Rótulos pt-BR da procedência do e-mail. */
export const EMAIL_STATUS_LABEL: Record<EmailStatus, string> = {
  verified: "Verificado",
  public: "Público",
  inferred: "Inferido",
  unknown: "Sem e-mail",
};

/** Uma empresa (PJ) — a oportunidade que anda no funil. */
export interface Company {
  /** Identificador estável (slug). */
  id: string;
  /** Nome fantasia / como a empresa é conhecida. */
  name: string;
  /** Razão social, se encontrada. */
  legalName?: string;
  /** CNPJ (só dígitos ou formatado — dado público). */
  cnpj?: string;
  /** Setor/segmento. */
  sector?: string;
  /** Cidade (foco: BH e região metropolitana). */
  city?: string;
  /** Porte estimado (texto livre, ex.: "100–500 funcionários"). */
  size?: string;
  /** Domínio do site (ex.: "empresa.com.br"). */
  website?: string;
  /** Onde o agente encontrou a empresa (ex.: "LinkedIn", "Google Maps"). */
  source: string;
  /** Estágio no funil. */
  stage: LeadStage;
  /** Fit com a oferta, de 0 a 100 (heurística do agente). */
  score?: number;
  /** Slug do agente que trouxe a empresa (ex.: "prospector-bh"). */
  foundBy?: string;
  /** Data ISO em que a empresa entrou. */
  addedAt: string;
  /** Observação do agente (por que é um bom lead). */
  note?: string;
}

/** Uma pessoa (PF) — contato/tomador de decisão dentro de uma empresa. */
export interface Person {
  /** Identificador estável (slug). */
  id: string;
  /** Nome da pessoa. */
  name: string;
  /** Cargo/papel na empresa. */
  role?: string;
  /** E-mail encontrado ou inferido. */
  email?: string;
  /** Procedência do e-mail (nunca apresentar inferido como confirmado). */
  emailStatus?: EmailStatus;
  /** CPF (dado pessoal sensível — normalmente vazio; founder preenche). */
  cpf?: string;
  /** Empresa a que este contato pertence (`Company.id`). */
  companyId?: string;
  /** Onde o agente encontrou o contato (ex.: "LinkedIn"). */
  source: string;
  /** Slug do agente que trouxe o contato. */
  foundBy?: string;
  /** Data ISO em que o contato entrou. */
  addedAt: string;
  /** Observação do agente. */
  note?: string;
}

/** Forma do arquivo de persistência `data/leads.json`. */
export interface LeadsData {
  companies: Company[];
  people: Person[];
}

/** Conta empresas por estágio, incluindo estágios sem nenhuma. Função pura. */
export function countByStage(companies: Company[]): Record<LeadStage, number> {
  const counts = {
    new: 0,
    contacted: 0,
    qualified: 0,
    negotiating: 0,
    won: 0,
    lost: 0,
  } satisfies Record<LeadStage, number>;
  for (const c of companies) counts[c.stage] += 1;
  return counts;
}

/** Deixa só os dígitos de um documento (CPF/CNPJ). */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formata um CNPJ (14 dígitos) como 00.000.000/0000-00; devolve cru se inválido. */
export function formatCnpj(cnpj: string | undefined): string {
  if (!cnpj) return "";
  const d = onlyDigits(cnpj);
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Formata um CPF (11 dígitos) como 000.000.000-00; devolve cru se inválido. */
export function formatCpf(cpf: string | undefined): string {
  if (!cpf) return "";
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
