import type { Section, Status } from "./schema";

/**
 * Mapa enum -> rotulo pt-BR para a UI (docs/02-content-model.md §6.2 e §6.5).
 * Os arquivos guardam sempre o identificador em ingles; a UI renderiza o rotulo.
 */

export const SECTION_LABEL: Record<Section, string> = {
  founder: "Founder",
  direcao: "Direção",
  validacao: "Validação",
  caixa: "Caixa",
};

export const STATUS_LABEL: Record<Status, string> = {
  empty: "Vazio",
  draft: "Rascunho",
  in_progress: "Em progresso",
  needs_review: "Aguardando revisão",
  validated: "Validado",
  archived: "Arquivado",
};
