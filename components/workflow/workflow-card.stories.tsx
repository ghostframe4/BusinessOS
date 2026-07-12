import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WorkflowCard } from "@/components/workflow/workflow-card";
import type { EntityMeta } from "@/lib/content/schema";

/** Fixture-base de EntityMeta (inline — sem tocar o fs). */
const baseEntity: EntityMeta = {
  id: "direcao/mapa-do-mercado",
  section: "direcao",
  entity: "mapa-do-mercado",
  title: "Mapa do mercado",
  status: "in_progress",
  summary:
    "Território, players e alternativas, tendências e onde jogar — o mapa que orienta as apostas da direção.",
  tags: ["mercado", "pesquisa"],
  order: 2,
  updated: "2026-07-09T10:15:00-03:00",
  last_edited_by: "founder",
};

/**
 * Card de uma entidade dentro do board de workflow (sistema "Flux"). Sobre o
 * canvas off-white quente, um card branco `rounded-2xl` traz seção, título,
 * resumo e — o sinal central — QUEM responde: um pill com o slug do agente da
 * alçada, ou o pill de contorno "Só founder" para entidades `founder_only`.
 * Quando há proposta pendente o card ganha um anel lavanda e o pill vira
 * lavanda pastel, com o rótulo textual "propôs — aguarda você" sempre visível
 * ao lado (cor nunca é o único sinal). O card inteiro é um link para a página
 * da entidade — o board é só leitura: "IA propõe, founder dispõe".
 */
const meta = {
  title: "Workflow/WorkflowCard",
  component: WorkflowCard,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
  },
  args: {
    entity: baseEntity,
    agentSlug: "mercado",
    isProposal: false,
  },
  decorators: [
    (Story) => (
      // fundo canvas quente para o card branco + anel lerem bem
      <div className="rounded-3xl bg-background p-8">
        <div className="w-80">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof WorkflowCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Entidade sob a alçada de um agente, sem proposta pendente. */
export const ComAgente: Story = {};

/** Entidade `founder_only`: sem agente, pill de contorno "Só founder". */
export const SoFounder: Story = {
  args: {
    entity: {
      ...baseEntity,
      id: "founder/estilo-de-vida",
      section: "founder",
      entity: "estilo-de-vida",
      title: "Estilo de vida",
      summary:
        "Como o founder quer viver enquanto constrói — a restrição que a direção precisa respeitar.",
      tags: ["founder"],
    },
    agentSlug: null,
    isProposal: false,
  },
};

/** Proposta pendente: anel lavanda, pill pastel e rótulo "propôs — aguarda você". */
export const PropostaPendente: Story = {
  args: {
    entity: {
      ...baseEntity,
      status: "needs_review",
      last_edited_by: "agent:mercado",
    },
    agentSlug: "mercado",
    isProposal: true,
  },
};

/** Sem resumo: o card recolhe o parágrafo e mantém título + rodapé. */
export const SemResumo: Story = {
  args: {
    entity: { ...baseEntity, summary: "" },
  },
};

/** Card em arraste: esmaece (`opacity-50`) enquanto é movido pelo board. */
export const Arrastando: Story = {
  args: {
    dragging: true,
    dragProps: { draggable: true },
  },
};

/** Entidade validada — status no topo, ainda sob alçada do agente. */
export const Validada: Story = {
  args: {
    entity: { ...baseEntity, status: "validated" },
  },
};

/** Card vazio (status `empty`): ponto de partida antes de qualquer rascunho. */
export const Vazia: Story = {
  args: {
    entity: {
      ...baseEntity,
      id: "direcao/oferta",
      entity: "oferta",
      title: "Oferta",
      status: "empty",
      summary: "",
      tags: [],
    },
  },
};

/** Galeria: uma coluna do board com os estados lado a lado. */
export const Galeria: Story = {
  render: () => {
    const cards: {
      entity: EntityMeta;
      agentSlug: string | null;
      isProposal: boolean;
    }[] = [
      { entity: baseEntity, agentSlug: "mercado", isProposal: false },
      {
        entity: {
          ...baseEntity,
          id: "direcao/tese-de-valor",
          entity: "tese-de-valor",
          title: "Tese de valor",
          status: "needs_review",
          last_edited_by: "agent:tese",
          summary:
            "Por que o cliente ideal pagaria — a leitura que amarra ICP e problemas.",
        },
        agentSlug: "tese",
        isProposal: true,
      },
      {
        entity: {
          ...baseEntity,
          id: "founder/objetivo",
          section: "founder",
          entity: "objetivo",
          title: "Objetivo",
          status: "validated",
          summary: "Aonde o founder quer chegar e como saberá que chegou.",
          tags: ["founder"],
        },
        agentSlug: null,
        isProposal: false,
      },
    ];
    return (
      <div className="flex w-80 flex-col gap-3">
        {cards.map((c) => (
          <WorkflowCard key={c.entity.id} {...c} />
        ))}
      </div>
    );
  },
};
