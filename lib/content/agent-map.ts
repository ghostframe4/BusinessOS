/**
 * Mapa UI entidade -> agente responsavel e utilitarios de proposta (docs/05 §3.1).
 *
 * Espelha, para a camada de UI, a "alcada de escrita" de cada agente: qual slug
 * de agente propoe conteudo para cada entidade e qual e o papel desse agente.
 * Entidades `founder_only` (sem agente) mapeiam para `null` — so o founder edita.
 *
 * Identificadores/slug em ingles; textos de papel em pt-BR.
 */

/**
 * id da entidade ("<section>/<entity>") -> slug do agente responsavel.
 * `null` = entidade `founder_only` (nenhum agente propoe).
 */
export const ENTITY_AGENT: Record<string, string | null> = {
  // founder
  "founder/objetivo": "founder-coach",
  "founder/estilo-de-vida": null, // founder_only

  // direcao
  "direcao/mapa-do-mercado": "market-map",
  "direcao/ima-de-problemas": "problem-magnet",
  "direcao/perfil-ideal-de-cliente": "icp",
  "direcao/tese-de-valor": "value-thesis",
  "direcao/oferta": "offer-strategist",

  // validacao
  "validacao/oferta": "validation-synth",
  "validacao/primeiros-clientes": "validation-synth",

  // caixa
  "caixa/fluxo-de-caixa": "cash-flow",
  "caixa/erp": null, // founder_only
};

/**
 * Slug do agente -> frase curta pt-BR do seu papel (docs/05 §3.1).
 * Mostrada ao founder quando ele pede uma proposta a um agente.
 */
export const AGENT_PURPOSE: Record<string, string> = {
  "founder-coach": "Ajuda a articular objetivo e horizonte do founder.",
  "market-map": "Estrutura território, players, tendências e onde jogar.",
  "problem-magnet":
    "Lista e prioriza problemas que valem ser resolvidos, ancorados no founder.",
  icp: "Define o ICP: quem, contexto, dores, onde achar e o anti-perfil.",
  "value-thesis": "Formula a hipótese de valor a partir do ICP e das dores.",
  "offer-strategist":
    "Traduz a tese de valor em oferta estratégica (promessa, formato, preço-hipótese).",
  "validation-synth":
    "Sintetiza o aprendizado de campo e sugere ajustes na oferta validada.",
  "cash-flow": "Resume o mês, calcula saldo/runway e projeta premissas.",
};

/**
 * Uma entidade esta "em proposta" quando um agente escreveu sob `write_policy`
 * `propose`: o repositorio forca `status: needs_review` e grava
 * `last_edited_by: agent:<slug>` (docs/02 §10.4 passo 7 / docs/05 §8.1).
 */
export function isProposal(fm: {
  status: string;
  last_edited_by: string;
}): boolean {
  return fm.status === "needs_review" && fm.last_edited_by.startsWith("agent:");
}
