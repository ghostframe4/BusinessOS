import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { InsightCallout } from "@/components/entities/report/insight-callout";
import type { ReportInsight } from "@/lib/content/schema";

/** Fixture-base de ReportInsight (inline — sem tocar o fs). */
const baseInsight: ReportInsight = {
  text:
    "O segmento de criadores B2B cresce quase o dobro do mercado geral — entrar cedo compra vantagem de posicionamento antes da consolidação.",
  source: "https://www.imarc.com/reports/latam-creator-economy",
  source_label: "IMARC 2024",
};

/**
 * Callout de insight da faixa de dados (sistema "Flux"). Bloco lavanda pastel
 * `rounded-2xl` com ícone de lâmpada: a leitura acionável em uma frase (o "e
 * daí") e, quando o insight se ancora num dado externo, a fonte como link
 * discreto (host ou `source_label`) com ícone de link externo. O acento
 * lavanda marca "camada de leitura da IA" sem depender só de cor — o ícone e o
 * texto carregam o significado.
 */
const meta = {
  title: "Report/InsightCallout",
  component: InsightCallout,
  parameters: {
    layout: "centered",
  },
  args: {
    insight: baseInsight,
  },
  decorators: [
    (Story) => (
      // fundo canvas quente para o bloco lavanda ler bem
      <div className="rounded-3xl bg-background p-8">
        <div className="max-w-xl">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof InsightCallout>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Insight ancorado em dado externo, com fonte nomeada. */
export const ComFonte: Story = {};

/** Insight com fonte, mas sem `source_label`: mostra o host da URL. */
export const FonteSemRotulo: Story = {
  args: {
    insight: {
      ...baseInsight,
      source_label: undefined,
    },
  },
};

/** Insight sem fonte: leitura própria da IA, sem link de apoio. */
export const SemFonte: Story = {
  args: {
    insight: {
      text:
        "As três dores mais citadas convergem para o mesmo momento — a decisão semanal de foco. É aí que a oferta deve morder.",
    },
  },
};

/** Frase curta: o callout mantém respiro mesmo com pouco texto. */
export const FraseCurta: Story = {
  args: {
    insight: {
      text: "O anti-perfil é maior do que o perfil ideal — recusar é a estratégia.",
    },
  },
};

/** Galeria: pilha de insights como aparece na faixa de leitura. */
export const Galeria: Story = {
  render: () => {
    const insights: ReportInsight[] = [
      {
        text:
          "O segmento de criadores B2B cresce quase o dobro do mercado geral — entrar cedo compra vantagem de posicionamento.",
        source: "https://www.imarc.com/reports/latam-creator-economy",
        source_label: "IMARC 2024",
      },
      {
        text:
          "As três dores mais citadas convergem para a decisão semanal de foco. É aí que a oferta deve morder.",
      },
      {
        text: "O anti-perfil é maior do que o perfil ideal — recusar é a estratégia.",
      },
    ];
    return (
      <div className="flex max-w-xl flex-col gap-4">
        {insights.map((insight, i) => (
          <InsightCallout key={i} insight={insight} />
        ))}
      </div>
    );
  },
};
