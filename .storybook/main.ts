import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

/** Resolve um caminho relativo a este arquivo (.storybook/). */
const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

const config: StorybookConfig = {
  "stories": [
    "../components/**/*.mdx",
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "..\\public"
  ],
  // As server actions em `app/(app)/**/actions.ts` importam `node:fs`/`node:crypto`
  // (via repository.ts) e não têm o transform de Server Actions do Next no build
  // do Vite. Trocamos esses módulos por stubs só no ambiente de stories, para
  // que componentes de formulário (EntityForm, ProposalBar, AgentEditor, …)
  // rendam sem quebrar. Os componentes de app ficam intactos.
  async viteFinal(viteConfig) {
    const stubs = [
      {
        find: "@/app/(app)/[section]/[entity]/actions",
        replacement: here("./mocks/entity-actions.ts"),
      },
      {
        find: "@/app/(app)/agentes/actions",
        replacement: here("./mocks/agentes-actions.ts"),
      },
      {
        find: "@/app/(app)/agentes/[slug]/actions",
        replacement: here("./mocks/agente-slug-actions.ts"),
      },
    ];
    viteConfig.resolve ??= {};
    const existing = viteConfig.resolve.alias;
    // Normaliza para forma de array e coloca os stubs na frente (aliases mais
    // específicos primeiro), preservando os aliases do framework (ex.: `@/`).
    const existingArray = Array.isArray(existing)
      ? existing
      : Object.entries(existing ?? {}).map(([find, replacement]) => ({
          find,
          replacement: replacement as string,
        }));
    viteConfig.resolve.alias = [...stubs, ...existingArray];
    return viteConfig;
  },
};
export default config;
