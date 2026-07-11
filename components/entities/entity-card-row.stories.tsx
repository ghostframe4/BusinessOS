import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EntityCardRow } from "@/components/entities/entity-card-row";
import type { EntityMeta } from "@/lib/content/schema";

/** Fixture-base de EntityMeta (inline — sem tocar o fs). */
const baseEntity: EntityMeta = {
  id: "validacao/primeiros-clientes",
  section: "validacao",
  entity: "primeiros-clientes",
  title: "Primeiros clientes",
  status: "in_progress",
  summary:
    "Quem são os primeiros clientes reais, como chegaram e o que aprendemos com cada conversa.",
  tags: ["vendas", "descoberta"],
  order: 2,
  updated: "2026-07-05T09:10:00-03:00",
  last_edited_by: "founder",
};

/**
 * Card de entidade — variante LISTA (docs/03 §7.2). Linha densa de largura
 * total: título + resumo, data (a partir de `lg`), StatusBadge e chevron.
 */
const meta = {
  title: "Entities/EntityCardRow",
  component: EntityCardRow,
  parameters: {
    layout: "padded",
    nextjs: { appDirectory: true },
  },
  args: {
    entity: baseEntity,
  },
  decorators: [
    (Story) => (
      // fundo canvas (limão) para a linha branca + sombra suave lerem bem
      <div className="rounded-3xl bg-background p-6">
        <div className="mx-auto max-w-2xl">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof EntityCardRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutSummary: Story = {
  args: {
    entity: { ...baseEntity, summary: "" },
  },
};

export const NeedsReview: Story = {
  args: {
    entity: {
      ...baseEntity,
      status: "needs_review",
      last_edited_by: "agent:vendas",
    },
  },
};

export const Validated: Story = {
  args: {
    entity: { ...baseEntity, status: "validated" },
  },
};

export const Archived: Story = {
  args: {
    entity: { ...baseEntity, status: "archived" },
  },
};
