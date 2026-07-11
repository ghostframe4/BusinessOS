import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EntityCard } from "@/components/entities/entity-card";
import type { EntityMeta } from "@/lib/content/schema";

/** Fixture-base de EntityMeta (inline — sem tocar o fs). */
const baseEntity: EntityMeta = {
  id: "direcao/tese-de-valor",
  section: "direcao",
  entity: "tese-de-valor",
  title: "Tese de valor",
  status: "in_progress",
  summary:
    "Por que este produto importa para o cliente ideal e o que o torna difícil de ignorar frente às alternativas.",
  tags: ["posicionamento", "narrativa", "mercado"],
  order: 3,
  updated: "2026-07-08T14:30:00-03:00",
  last_edited_by: "founder",
};

/**
 * Card de entidade — variante GRID (docs/03 §7.2). Título + StatusBadge, resumo
 * com clamp de 2 linhas, data de atualização em pt-BR e até 3 tags.
 */
const meta = {
  title: "Entities/EntityCard",
  component: EntityCard,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
  },
  args: {
    entity: baseEntity,
  },
  decorators: [
    (Story) => (
      // fundo canvas (limão) para o card branco + sombra suave lerem bem
      <div className="rounded-3xl bg-background p-8">
        <div className="w-80">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof EntityCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithTags: Story = {
  args: {
    entity: { ...baseEntity, tags: ["posicionamento", "narrativa", "mercado"] },
  },
};

export const WithoutTags: Story = {
  args: {
    entity: { ...baseEntity, tags: [] },
  },
};

export const WithoutSummary: Story = {
  args: {
    entity: { ...baseEntity, summary: "" },
  },
};

export const Empty: Story = {
  args: {
    entity: {
      ...baseEntity,
      id: "founder/objetivo",
      section: "founder",
      entity: "objetivo",
      title: "Objetivo",
      status: "empty",
      summary: "",
      tags: [],
    },
  },
};

export const NeedsReview: Story = {
  args: {
    entity: {
      ...baseEntity,
      status: "needs_review",
      last_edited_by: "agent:mercado",
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
