import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StageBadge } from "@/components/leads/stage-badge";
import { LEAD_STAGES, type LeadStage } from "@/lib/leads/types";

/**
 * Badge de estágio do funil no sistema "Flux". Escala do outline neutro
 * (novo, tracejado) ao limão preenchido (ganho, com check), passando pela
 * lavanda pastel dos estágios ativos que pedem atenção (qualificado); perdido
 * fica esmaecido com um "x". Pill `rounded-full` com o rótulo pt-BR SEMPRE
 * visível — cor/forma nunca é o único sinal (acessibilidade), espelhando o
 * `StatusBadge` das entidades.
 */
const meta = {
  title: "Leads/StageBadge",
  component: StageBadge,
  parameters: {
    layout: "centered",
  },
  args: {
    stage: "new",
  },
} satisfies Meta<typeof StageBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const New: Story = {
  args: { stage: "new" },
};

export const Contacted: Story = {
  args: { stage: "contacted" },
};

export const Qualified: Story = {
  args: { stage: "qualified" },
};

export const Negotiating: Story = {
  args: { stage: "negotiating" },
};

export const Won: Story = {
  args: { stage: "won" },
};

export const Lost: Story = {
  args: { stage: "lost" },
};

/** Galeria com toda a escala de estágios do funil lado a lado (sistema Flux). */
export const AllStages: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {LEAD_STAGES.map((stage: LeadStage) => (
        <StageBadge key={stage} stage={stage} />
      ))}
    </div>
  ),
};
