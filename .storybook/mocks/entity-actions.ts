/**
 * Stub das server actions de `@/app/(app)/[section]/[entity]/actions` para o
 * Storybook. O build do Vite não tem o transform de Server Actions do Next, e o
 * módulo real puxa `node:fs` (via repository.ts), o que quebraria as stories.
 * O alias em `.storybook/main.ts` troca o módulo real por este no ambiente de
 * stories — em runtime só devolvemos um resultado de sucesso plausível.
 */
export async function saveEntity() {
  return { ok: true, revision: 2, updated: "2026-07-11T12:00:00-03:00" };
}

export async function approveProposal() {
  return { ok: true, revision: 2, updated: "2026-07-11T12:00:00-03:00" };
}

export async function rejectProposal() {
  return { ok: true, revision: 2, updated: "2026-07-11T12:00:00-03:00" };
}
