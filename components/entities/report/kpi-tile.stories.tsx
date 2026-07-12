import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { KpiTile } from "@/components/entities/report/kpi-tile";
import type { ReportKpi } from "@/lib/content/schema";

/** Fixture-base de ReportKpi (inline — sem tocar o fs). */
const baseKpi: ReportKpi = {
  label: "Mercado LatAm",
  value: "US$ 4,2 bi",
  kind: "fact",
  source: "https://www.imarc.com/reports/latam-creator-economy",
  source_label: "IMARC 2024",
  note: "CAGR ~20,7% até 2033",
};

/**
 * Tile de KPI da faixa de dados (sistema "Flux"). Card branco `rounded-2xl`
 * sobre o canvas quente: o valor em cima, grande e pesado (Geist), escalado
 * pelo comprimento; abaixo, rótulo e nota discretos. A natureza do dado tem
 * sinal textual/gráfico, nunca só cor: `goal` ganha o chip pill limão "meta";
 * `fact` com fonte mostra o link discreto (host ou `source_label`) com ícone
 * de link externo; `fact` sem fonte recebe apenas um ponto lavanda sutil
 * (dado decorativo, sem lastro externo).
 */
const meta = {
  title: "Report/KpiTile",
  component: KpiTile,
  parameters: {
    layout: "centered",
  },
  args: {
    kpi: baseKpi,
  },
  decorators: [
    (Story) => (
      // fundo canvas quente para o tile branco ler bem
      <div className="rounded-3xl bg-background p-8">
        <div className="w-64">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof KpiTile>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Fato externo com fonte nomeada e nota de contexto. */
export const FatoComFonte: Story = {};

/** Fato externo com fonte, mas sem `source_label`: mostra o host da URL. */
export const FatoFonteSemRotulo: Story = {
  args: {
    kpi: {
      ...baseKpi,
      source_label: undefined,
    },
  },
};

/** Fato sem fonte: acento lavanda sutil, sem link (dado decorativo). */
export const FatoSemFonte: Story = {
  args: {
    kpi: {
      label: "Segmento",
      value: "Criadores B2B",
      kind: "fact",
    },
  },
};

/** Meta/expectativa do negócio: chip pill limão "meta", sem link. */
export const MetaDoNegocio: Story = {
  args: {
    kpi: {
      label: "Meta de membros",
      value: "1.000",
      kind: "goal",
      note: "até dez/2026",
    },
  },
};

/** Sem nota: só valor + rótulo. */
export const SemNota: Story = {
  args: {
    kpi: {
      label: "Renda-alvo",
      value: "R$ 40 mil/mês",
      kind: "goal",
    },
  },
};

/** Valor curto: ganha o maior corpo tipográfico (número grande). */
export const ValorCurto: Story = {
  args: {
    kpi: {
      label: "Runway",
      value: "8 meses",
      kind: "goal",
    },
  },
};

/** Valor longo (faixa/frase): recua de tamanho para não quebrar em cascata. */
export const ValorLongo: Story = {
  args: {
    kpi: {
      label: "Hipótese central",
      value: "Founders solo pagam por clareza de decisão semanal",
      kind: "fact",
    },
  },
};

/** Galeria: a faixa de dados com os quatro estados lado a lado. */
export const Galeria: Story = {
  render: () => {
    const kpis: ReportKpi[] = [
      {
        label: "Mercado LatAm",
        value: "US$ 4,2 bi",
        kind: "fact",
        source: "https://www.imarc.com/reports/latam-creator-economy",
        source_label: "IMARC 2024",
        note: "CAGR ~20,7% até 2033",
      },
      { label: "Segmento", value: "Criadores B2B", kind: "fact" },
      {
        label: "Meta de membros",
        value: "1.000",
        kind: "goal",
        note: "até dez/2026",
      },
      { label: "Renda-alvo", value: "R$ 40 mil/mês", kind: "goal" },
    ];
    return (
      <div className="grid w-[34rem] grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <KpiTile key={kpi.label} kpi={kpi} />
        ))}
      </div>
    );
  },
};
