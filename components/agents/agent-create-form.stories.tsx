import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";

import { AgentCreateForm } from "@/components/agents/agent-create-form";

/**
 * Form de criação de um novo subagente (`.claude/agents/<slug>.md`). Sistema
 * "Flux": campos full-width em cards brancos `rounded-3xl`, botão "Criar agente"
 * limão. O "Nome" vira o slug em kebab-case (mostrado ao vivo abaixo do campo),
 * usado como nome do arquivo e como `agent:<slug>`. Ao criar com sucesso, navega
 * para o editor. A action de criação resolve para o stub de story. O form em si
 * não tem `max-w` — só o decorator.
 */
const meta = {
  title: "Agents/AgentCreateForm",
  component: AgentCreateForm,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
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
} satisfies Meta<typeof AgentCreateForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Form vazio (estado inicial). */
export const Vazio: Story = {};

/** Preenchido via play: o slug reage ao "Nome" digitado. */
export const Preenchido: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByLabelText("Nome"),
      "pesquisador de mercado",
    );
    await userEvent.type(
      canvas.getByLabelText("Descrição"),
      "Mapeia território, players e tendências para orientar a direção.",
    );
    // O campo do system prompt não tem label associado — alvo pelo placeholder.
    await userEvent.type(
      canvas.getByPlaceholderText(/Voce e o agente/i),
      "Voce e o agente `agent:pesquisador-de-mercado`.",
    );
  },
};
