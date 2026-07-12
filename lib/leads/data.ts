import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import type { Company, LeadsData, Person } from "@/lib/leads/types";

/**
 * Camada de leitura do mini CRM. Os leads (empresas + contatos) são persistidos
 * em `data/leads.json` e populados pelos agentes de prospecção. Este módulo usa
 * `fs`, então é SERVER-ONLY — importe-o apenas de Server Components / rotas.
 * Helpers puros (contagem, formatação) vivem em `lib/leads/types.ts` e podem ir
 * ao client.
 *
 * As páginas de leads/oportunidades são `dynamic = "force-dynamic"`, então a
 * leitura acontece a cada request e reflete a base assim que os agentes gravam.
 */

const DATA_FILE = path.join(process.cwd(), "data", "leads.json");

const EMPTY: LeadsData = { companies: [], people: [] };

/** Lê e faz o parse do arquivo de leads; devolve base vazia se ainda não existe. */
function load(): LeadsData {
  if (!existsSync(DATA_FILE)) return EMPTY;
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<LeadsData>;
    return {
      companies: parsed.companies ?? [],
      people: parsed.people ?? [],
    };
  } catch {
    // Arquivo corrompido/ilegível não deve derrubar a página — trata como vazio.
    return EMPTY;
  }
}

/** Todas as empresas (PJ) do CRM. */
export function listCompanies(): Company[] {
  return load().companies;
}

/** Todas as pessoas (PF/contatos) do CRM. */
export function listPeople(): Person[] {
  return load().people;
}

/** Empresa por id, ou `undefined`. */
export function getCompany(id: string): Company | undefined {
  return load().companies.find((c) => c.id === id);
}

/** Contatos (pessoas) de uma empresa. */
export function peopleOfCompany(companyId: string): Person[] {
  return load().people.filter((p) => p.companyId === companyId);
}
