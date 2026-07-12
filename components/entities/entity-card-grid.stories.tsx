import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EntityCardGrid } from "@/components/entities/entity-card-grid";
import type { EntityMeta } from "@/lib/content/schema";

/** Fixtures de EntityMeta (inline — sem tocar o fs). */
const entities: EntityMeta[] = [
  {
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
  },
  {
    id: "direcao/perfil-ideal-de-cliente",
    section: "direcao",
    entity: "perfil-ideal-de-cliente",
    title: "Perfil ideal de cliente",
    status: "needs_review",
    summary:
      "Quem exatamente é o cliente ideal, em que contexto ele está e quais gatilhos o levam a buscar uma solução.",
    tags: ["icp", "segmentação"],
    order: 2,
    updated: "2026-07-10T09:00:00-03:00",
    last_edited_by: "agent:icp",
  },
  {
    id: "direcao/mapa-do-mercado",
    section: "direcao",
    entity: "mapa-do-mercado",
    title: "Mapa do mercado",
    status: "validated",
    summary:
      "O território, os players e as alternativas, as tendências e onde vale a pena jogar.",
    tags: ["mercado", "competição"],
    order: 1,
    updated: "2026-06-30T18:20:00-03:00",
    last_edited_by: "founder",
  },
  {
    id: "founder/objetivo",
    section: "founder",
    entity: "objetivo",
    title: "Objetivo",
    status: "empty",
    summary: "",
    tags: [],
    order: 0,
    updated: "2026-07-01T08:00:00-03:00",
    last_edited_by: "founder",
  },
];

/**
 * Container que arranja as entidades no layout certo conforme `view` (docs/03
 * §7.2): grid responsivo de cards brancos `rounded-3xl` no sistema "Flux" ou
 * lista densa de linhas. Puro de apresentação — o estado vazio fica a cargo da
 * page. As duas variantes compartilham as mesmas entidades para comparação.
 */
const meta = {
  title: "Entities/EntityCardGrid",
  component: EntityCardGrid,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: {
    entities,
    view: "grid",
  },
  decorators: [
    (Story) => (
      // canvas quente para os cards brancos + sombra suave lerem bem
      <div className="min-h-screen bg-background p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EntityCardGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Grid responsivo (1 / 2 / 3 colunas) de cards. */
export const Grid: Story = {
  args: { view: "grid" },
};

/** Lista densa de linhas (uma entidade por linha). */
export const List: Story = {
  args: { view: "list" },
};

/** Poucas entidades: o grid não estica além do necessário. */
export const PoucosItens: Story = {
  args: { view: "grid", entities: entities.slice(0, 2) },
};
