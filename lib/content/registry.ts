import type { Section, WritePolicy } from "./schema";

/**
 * Registro canonico das 11 entidades (docs/02-content-model.md §8.1).
 * E a LISTA DE VERDADE: a UI usa o REGISTRY para renderizar sidebar/paginas e o
 * seeder para criar arquivos ausentes. O filesystem apenas materializa o registro.
 */

export interface EntityDef {
  id: string;
  section: Section;
  entity: string;
  title: string;
  order: number;
  defaultWritePolicy: WritePolicy;
  /** vira ai_context.purpose no seed */
  purpose: string;
  /** vira ai_context.related no seed */
  related?: string[];
}

export const REGISTRY: EntityDef[] = [
  // founder
  {
    id: "founder/objetivo",
    section: "founder",
    entity: "objetivo",
    title: "Objetivo",
    order: 1,
    defaultWritePolicy: "propose",
    purpose: "O que o founder quer alcancar com este negocio.",
  },
  {
    id: "founder/estilo-de-vida",
    section: "founder",
    entity: "estilo-de-vida",
    title: "Estilo de vida",
    order: 2,
    defaultWritePolicy: "founder_only",
    purpose: "A vida (tempo, renda, liberdade) que o negocio precisa sustentar.",
  },

  // direcao
  {
    id: "direcao/mapa-do-mercado",
    section: "direcao",
    entity: "mapa-do-mercado",
    title: "Mapa do mercado",
    order: 1,
    defaultWritePolicy: "propose",
    purpose: "O territorio onde o negocio joga.",
  },
  {
    id: "direcao/ima-de-problemas",
    section: "direcao",
    entity: "ima-de-problemas",
    title: "Ima de problemas",
    order: 2,
    defaultWritePolicy: "propose",
    purpose: "Os problemas que atraem o founder e valem ser resolvidos.",
  },
  {
    id: "direcao/perfil-ideal-de-cliente",
    section: "direcao",
    entity: "perfil-ideal-de-cliente",
    title: "Perfil ideal de cliente",
    order: 3,
    defaultWritePolicy: "propose",
    purpose: "O ICP: para quem exatamente.",
  },
  {
    id: "direcao/tese-de-valor",
    section: "direcao",
    entity: "tese-de-valor",
    title: "Tese de valor",
    order: 4,
    defaultWritePolicy: "propose",
    purpose: "Por que esse cliente pagaria; a hipotese de valor.",
    related: ["direcao/perfil-ideal-de-cliente", "direcao/ima-de-problemas"],
  },
  {
    id: "direcao/oferta",
    section: "direcao",
    entity: "oferta",
    title: "Oferta (tese)",
    order: 5,
    defaultWritePolicy: "propose",
    purpose: "A oferta como intencao estrategica (versao direcao).",
    related: ["direcao/tese-de-valor"],
  },

  // validacao
  {
    id: "validacao/oferta",
    section: "validacao",
    entity: "oferta",
    title: "Oferta (validada)",
    order: 1,
    defaultWritePolicy: "propose",
    purpose: "A oferta como e testada/refinada em campo (versao validacao).",
    related: ["direcao/oferta"],
  },
  {
    id: "validacao/primeiros-clientes",
    section: "validacao",
    entity: "primeiros-clientes",
    title: "Primeiros clientes",
    order: 2,
    defaultWritePolicy: "propose",
    purpose: "Os primeiros clientes reais e o aprendizado extraido deles.",
    related: ["validacao/oferta", "direcao/perfil-ideal-de-cliente"],
  },

  // caixa
  {
    id: "caixa/fluxo-de-caixa",
    section: "caixa",
    entity: "fluxo-de-caixa",
    title: "Fluxo de caixa",
    order: 1,
    defaultWritePolicy: "propose",
    purpose: "Entradas e saidas ao longo do tempo.",
  },
  {
    id: "caixa/erp",
    section: "caixa",
    entity: "erp",
    title: "ERP",
    order: 2,
    defaultWritePolicy: "founder_only",
    purpose:
      "Documento de contexto sobre operacao/registro financeiro (nao modulo transacional).",
  },
];

/** Busca a definicao canonica de uma entidade pelo id "<section>/<entity>". */
export function getEntityDef(id: string): EntityDef | undefined {
  return REGISTRY.find((d) => d.id === id);
}
