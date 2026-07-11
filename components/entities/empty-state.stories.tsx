import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Rocket } from "lucide-react";

import { EmptyState } from "@/components/entities/empty-state";

/**
 * Estado vazio de uma seção/entidade sem conteúdo (docs/03 §9.1). Bloco
 * centralizado com ícone, título, descrição e ação primária opcional (só
 * renderiza o botão quando `actionLabel` e `actionHref` vêm juntos).
 */
const meta = {
  title: "Entities/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "padded",
    nextjs: { appDirectory: true },
  },
  args: {
    title: "Nada por aqui ainda",
    description:
      "Esta seção guarda as decisões de direção do negócio. Comece registrando a primeira entidade.",
  },
  argTypes: {
    icon: { control: false },
  },
  decorators: [
    (Story) => (
      // fundo canvas (limão) para o bloco branco + sombra suave lerem bem
      <div className="rounded-3xl bg-background p-6">
        <div className="mx-auto max-w-xl">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    actionLabel: "Criar oferta",
    actionHref: "/direcao/oferta",
  },
};

export const Custom: Story = {
  args: {
    icon: Rocket,
    title: "Comece a validar",
    description:
      "Registre os primeiros clientes reais e o que você aprendeu com cada conversa.",
    actionLabel: "Adicionar cliente",
    actionHref: "/validacao/primeiros-clientes",
  },
};

export const TitleOnly: Story = {
  args: {
    description: undefined,
  },
};
