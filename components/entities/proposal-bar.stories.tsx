import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProposalBar } from "@/components/entities/proposal-bar";

/**
 * Banner de decisão sobre uma proposta de agente (docs/05 §6). Sistema "Flux":
 * uma faixa `rounded-3xl` no acento lavanda pastel com o ícone Sparkles, o slug
 * do agente que propôs (`agent:<slug>`, em mono) e as ações "Rejeitar" (outline)
 * / "Aprovar" (limão). Aparece acima do form APENAS quando há proposta pendente
 * (`isProposal(frontmatter)`); é o pai que decide renderizá-lo, então o próprio
 * componente é sempre a barra em si. As ações resolvem para os stubs de story.
 */
const meta = {
  title: "Entities/ProposalBar",
  component: ProposalBar,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: {
    id: "direcao/mapa-do-mercado",
    baseRevision: 4,
    agentSlug: "market-map",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto w-full max-w-3xl">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof ProposalBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Proposta pendente do agente responsável pela entidade. */
export const Padrao: Story = {};

/** Outro agente propôs (o slug em mono reflete o autor). */
export const OutroAgente: Story = {
  args: {
    id: "direcao/perfil-ideal-de-cliente",
    baseRevision: 2,
    agentSlug: "icp",
  },
};
