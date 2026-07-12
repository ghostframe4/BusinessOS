import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { GenerateBriefing } from "@/components/entities/generate-briefing";
import type { Question } from "@/lib/content/questionnaire";

/** Perguntas do questionário (inline — sem tocar o fs). */
const questions: Question[] = [
  {
    heading: "Território",
    label: "Qual é o território deste mercado?",
    hint: "A categoria ampla onde você joga.",
    placeholder: "Ex.: ferramentas de decisão para founders solo",
  },
  {
    heading: "Players e alternativas",
    label: "Quem são os players e as alternativas?",
    hint: "Concorrentes diretos e o que as pessoas usam hoje.",
    placeholder: "Ex.: planilhas, Notion, consultorias avulsas",
  },
  {
    heading: "Tendências",
    label: "Quais tendências movem este mercado?",
    placeholder: "Ex.: IA barateando análise, mais solo-founders",
  },
];

/** Respostas parciais (2 de 3 preenchidas). */
const partialAnswers: Record<string, string> = {
  Território: "Ferramentas de decisão para founders solo em estágio pré-seed.",
  "Players e alternativas":
    "Hoje resolvem com planilhas, Notion e conselhos avulsos de mentores.",
};

/** Respostas completas (todas preenchidas). */
const fullAnswers: Record<string, string> = {
  ...partialAnswers,
  Tendências:
    "IA barateia a análise; mais gente empreende sozinha e busca clareza semanal.",
};

/**
 * Botão "Gerar briefing com IA" (docs/05 §7). Sistema "Flux": pill `outline`
 * que abre um Dialog (card branco `rounded-3xl`) com o contador de respostas e
 * o prompt pronto (mono, com botão "Copiar") para o founder colar no Claude
 * Code. O prompt muda conforme a política: `propose` instrui o subagente a
 * escrever via CLIs; `founder_only` (`agentSlug === null`) pede só o texto de
 * volta. Nada é publicado sem revisão.
 */
const meta = {
  title: "Entities/GenerateBriefing",
  component: GenerateBriefing,
  parameters: {
    layout: "centered",
  },
  args: {
    id: "direcao/mapa-do-mercado",
    title: "Mapa do mercado",
    questions,
    answers: partialAnswers,
    agentSlug: "market-map",
  },
} satisfies Meta<typeof GenerateBriefing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Estado ocioso: só o botão (o Dialog abre ao clicar). */
export const Idle: Story = {};

/** Dialog aberto com respostas parciais — o vago vira "a preencher". */
export const AbertoParcial: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /gerar briefing com ia/i }),
    );
    const dialog = within(await within(document.body).findByRole("dialog"));
    await expect(dialog.getByText(/2 de 3 perguntas/i)).toBeInTheDocument();
  },
};

/** Todas as respostas preenchidas. */
export const RespostasCompletas: Story = {
  args: { answers: fullAnswers },
};

/** Entidade `founder_only`: o prompt pede só o texto (sem `agent:write`). */
export const FounderOnly: Story = {
  args: {
    id: "founder/estilo-de-vida",
    title: "Estilo de vida",
    agentSlug: null,
  },
};
