/**
 * Erros de dominio do repositorio de conteudo (docs/02 §10.2 / docs/04 §7.1).
 * O chamador (Server Action, Route Handler, skill) mapeia cada tipo para uma
 * resposta apropriada (409 conflito, 422 validacao, 403 politica, 404 registro).
 */

/** Revision divergente: outro ator escreveu no intervalo (conflito otimista). */
export class ConflictError extends Error {
  readonly currentRevision?: number;
  constructor(
    message = "O conteudo mudou desde a leitura (conflito de revisao).",
    currentRevision?: number,
  ) {
    super(message);
    this.name = "ConflictError";
    this.currentRevision = currentRevision;
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/** Frontmatter falhou na validacao Zod. `fieldErrors` mapeia caminho -> mensagem. */
export class ValidationError extends Error {
  readonly fieldErrors?: Record<string, string>;
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/** write_policy proibiu a escrita (ex.: agente em entidade `founder_only`). */
export class PolicyError extends Error {
  constructor(message = "Escrita bloqueada pela politica desta entidade.") {
    super(message);
    this.name = "PolicyError";
    Object.setPrototypeOf(this, PolicyError.prototype);
  }
}

/** id fora do REGISTRY canonico. */
export class NotInRegistryError extends Error {
  constructor(message = "Entidade fora do registro canonico (REGISTRY).") {
    super(message);
    this.name = "NotInRegistryError";
    Object.setPrototypeOf(this, NotInRegistryError.prototype);
  }
}
