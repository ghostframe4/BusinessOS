/**
 * Stub de `@/app/(app)/agentes/actions` para o Storybook (ver
 * entity-actions.ts). O módulo real usa `node:fs`/`node:crypto` e não roda no
 * build do Vite; o alias em `.storybook/main.ts` o substitui por este stub.
 */
export async function createNewAgent() {
  return { ok: true, slug: "novo-agente" };
}
