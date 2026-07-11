import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Compass } from "lucide-react";

import { NavItem } from "@/components/layout/nav-item";

/**
 * Item de navegação da sidebar (docs/03 §7.1) — visual "Flux".
 * Vive sobre o painel escuro da sidebar: inativo usa `text-sidebar-muted` que
 * clareia no hover (`hover:bg-white/5`); ativo vira pill branca
 * (`bg-sidebar-accent` + texto escuro + `font-semibold`) com `aria-current="page"`.
 * O decorator reproduz o fundo `bg-sidebar` para as classes lerem corretamente.
 */
const meta = {
  title: "Layout/NavItem",
  component: NavItem,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
  },
  args: {
    href: "/direcao",
    label: "Direção",
    icon: Compass,
    active: false,
    disabled: false,
  },
  argTypes: {
    icon: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="w-64 rounded-3xl bg-sidebar p-3 text-sidebar-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NavItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Hover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Passe o ponteiro sobre o item para ver o realce (`hover:bg-white/5` + texto em `sidebar-foreground`). O estado de hover é puramente via CSS.",
      },
    },
  },
};

export const Active: Story = {
  args: { active: true },
  parameters: {
    docs: {
      description: {
        story:
          "Seção ativa: pill branca (`bg-sidebar-accent`) com texto escuro e `font-semibold`, marcada com `aria-current=\"page\"`.",
      },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  parameters: {
    docs: {
      description: {
        story:
          "Desabilitado: sem ponteiro nem foco (`pointer-events-none`), com opacidade reduzida.",
      },
    },
  },
};
