import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { GenerateReport } from "@/components/entities/generate-report";

/**
 * Botão "Gerar relatório" (docs/05 §7). Sistema "Flux": pill `brand` (limão)
 * com ícone de gráfico que abre um Dialog (card branco `rounded-3xl`) com o
 * prompt de PESQUISA pronto — a IA busca dados reais na web com fontes
 * verificáveis e propõe o bloco `report` (KPIs + insights). O prompt muda pela
 * política: `propose` grava só o campo `report` via CLIs; `founder_only`
 * (`agentSlug === null`) pede o JSON de volta. Nada é publicado sem revisão.
 */
const meta = {
  title: "Entities/GenerateReport",
  component: GenerateReport,
  parameters: {
    layout: "centered",
  },
  args: {
    id: "direcao/mapa-do-mercado",
    title: "Mapa do mercado",
    agentSlug: "market-map",
  },
} satisfies Meta<typeof GenerateReport>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Estado ocioso: só o botão limão (o Dialog abre ao clicar). */
export const Idle: Story = {};

/** Dialog aberto: o prompt de pesquisa pronto para copiar. */
export const Aberto: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /gerar relatório/i }),
    );
    const dialog = within(await within(document.body).findByRole("dialog"));
    await expect(
      dialog.getByText(/gerar relatório com ia/i),
    ).toBeInTheDocument();
  },
};

/** Entidade `founder_only`: o prompt pede o JSON de volta (sem `agent:write`). */
export const FounderOnly: Story = {
  args: {
    id: "founder/estilo-de-vida",
    title: "Estilo de vida",
    agentSlug: null,
  },
};
