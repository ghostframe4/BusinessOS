import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { AskAi } from "@/components/entities/ask-ai";

/**
 * Ponto de entrada de "pedir uma proposta à IA" (docs/05 §7). Sistema "Flux":
 * um botão pill `outline` "Pedir à IA" que abre um Dialog (card branco
 * `rounded-3xl`) com o agente responsável, seu propósito no bloco acento limão
 * e o comando pronto (mono, com botão "Copiar") para o founder colar no Claude
 * Code. Se a entidade é `founder_only` (`agentSlug === null`), some o botão e
 * fica só o lembrete de que só o founder edita. MVP sem chave de API: nada de
 * rede/LLM aqui.
 */
const meta = {
  title: "Entities/AskAI",
  component: AskAi,
  parameters: {
    layout: "centered",
  },
  args: {
    id: "direcao/mapa-do-mercado",
    title: "Mapa do mercado",
    agentSlug: "market-map",
  },
} satisfies Meta<typeof AskAi>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Estado ocioso: só o botão "Pedir à IA" (o Dialog abre ao clicar). */
export const Idle: Story = {};

/** Dialog aberto: agente responsável, propósito e comando pronto para copiar. */
export const Aberto: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /pedir à ia/i }),
    );
    const dialog = within(await within(document.body).findByRole("dialog"));
    await expect(
      dialog.getByText(/pedir uma proposta à ia/i),
    ).toBeInTheDocument();
  },
};

/** Entidade `founder_only`: sem agente — apenas o lembrete, sem botão. */
export const FounderOnly: Story = {
  args: {
    id: "founder/estilo-de-vida",
    title: "Estilo de vida",
    agentSlug: null,
  },
};
