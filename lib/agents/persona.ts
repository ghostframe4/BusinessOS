/**
 * Persona de apresentação dos subagentes: um nome amigável e um hash estável,
 * DERIVADOS do slug — puramente presentacional. Nada aqui é gravado nos
 * arquivos `.claude/agents/<slug>.md` (que definem o runtime do agente); é só
 * a camada de UI que dá "cara e nome" a cada card/avatar.
 */

/** Nomes curados para os agentes conhecidos (slug -> nome amigável). */
const NAMES: Record<string, string> = {
  "cash-flow": "Caio",
  "context-linter": "Íris",
  "founder-coach": "Bea",
  icp: "Ícaro",
  "market-map": "Marco",
  "offer-strategist": "Otto",
  "problem-magnet": "Magno",
  "seed-assistant": "Semi",
  summarizer: "Suma",
  "validation-synth": "Val",
  "value-thesis": "Teo",
};

/**
 * Nome amigável do agente. Usa o mapa curado; para slugs novos, deriva um nome
 * capitalizando o primeiro segmento (ex.: `growth-hacker` -> `Growth`).
 */
export function agentName(slug: string): string {
  const known = NAMES[slug];
  if (known) return known;
  const first = slug.split("-")[0] ?? slug;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Hash determinístico (djb2) do slug — semente estável para o avatar. */
export function agentSeed(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}
