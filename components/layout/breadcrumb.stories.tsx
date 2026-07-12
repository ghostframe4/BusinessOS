import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Breadcrumb } from "@/components/layout/breadcrumb";

/**
 * Trilha de navegação do topbar (docs/03 §7.1) — sistema visual "Flux".
 * Da raiz da seção até a entidade atual, sobre o canvas off-white quente:
 * itens intermediários são links em `text-muted-foreground` que escurecem no
 * hover; o último é sempre a página atual (`text-foreground`,
 * `aria-current="page"`, sem link), mesmo que traga `href`. Separador em
 * chevron esmaecido. Como usa `<Link>`, o decorator ativa `nextjs.appDirectory`.
 */
const meta = {
  title: "Layout/Breadcrumb",
  component: Breadcrumb,
  parameters: {
    layout: "padded",
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <div className="bg-background p-4 text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Breadcrumb>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Um nível: só a página atual, sem separador. */
export const SingleLevel: Story = {
  args: {
    items: [{ label: "Direção" }],
  },
};

/** Dois níveis: seção (link) → entidade atual. */
export const TwoLevels: Story = {
  args: {
    items: [
      { label: "Direção", href: "/direcao" },
      { label: "Perfil ideal de cliente" },
    ],
  },
};

/** Três níveis: raiz → seção → entidade atual. */
export const ThreeLevels: Story = {
  args: {
    items: [
      { label: "Início", href: "/" },
      { label: "Direção", href: "/direcao" },
      { label: "Mapa do mercado" },
    ],
  },
};

/** Rótulos longos truncam (`truncate`) em vez de quebrar a faixa. */
export const LongLabels: Story = {
  args: {
    items: [
      { label: "Direção", href: "/direcao" },
      {
        label:
          "Perfil ideal de cliente para produtos B2B de nicho com ciclo longo",
      },
    ],
  },
};
