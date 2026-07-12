import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Topbar } from "@/components/layout/topbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { StatusBadge } from "@/components/entities/status-badge";

/**
 * Topbar full-width do app (docs/03 §7.1) — sistema visual "Flux".
 * Faixa superior sobre o canvas off-white quente: a trilha de navegação fica à
 * esquerda e o alternador de tema à direita; só a faixa é `sticky`. Abaixo dela,
 * um bloco opcional (`children`) traz o título grande em tipografia Geist
 * pesada e a meta da entidade — esse bloco rola com a página.
 *
 * O decorator usa `bg-background` para reproduzir o canvas onde a barra vive, e
 * `nextjs.appDirectory` habilita os `<Link>` do breadcrumb.
 */
const meta = {
  title: "Layout/Topbar",
  component: Topbar,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Topbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Faixa completa: breadcrumb à esquerda, toggle à direita e bloco de título abaixo. */
export const Default: Story = {
  args: {
    breadcrumb: (
      <Breadcrumb
        items={[
          { label: "Direção", href: "/direcao" },
          { label: "Perfil ideal de cliente" },
        ]}
      />
    ),
    children: (
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Perfil ideal de cliente
        </h1>
        <StatusBadge status="validated" />
      </div>
    ),
  },
};

/** Só a faixa fixa (breadcrumb + toggle), sem bloco de título abaixo. */
export const OnlyBar: Story = {
  args: {
    breadcrumb: (
      <Breadcrumb
        items={[
          { label: "Direção", href: "/direcao" },
          { label: "Mapa do mercado" },
        ]}
      />
    ),
  },
};

/** Faixa sem breadcrumb: apenas o alternador de tema ancorado à direita. */
export const WithoutBreadcrumb: Story = {
  args: {
    children: (
      <h1 className="text-3xl font-semibold tracking-tight">Direção</h1>
    ),
  },
};

/** Título com subtítulo/meta no bloco rolável abaixo da faixa. */
export const WithMeta: Story = {
  args: {
    breadcrumb: (
      <Breadcrumb
        items={[
          { label: "Fundador", href: "/founder" },
          { label: "Objetivo" },
        ]}
      />
    ),
    children: (
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Objetivo</h1>
        <p className="text-sm text-muted-foreground">
          Atualizado há 2 dias · editado por founder
        </p>
      </div>
    ),
  },
};
