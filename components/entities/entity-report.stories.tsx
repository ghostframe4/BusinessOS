import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EntityReport } from "@/components/entities/entity-report";
import type { EntityDoc, Frontmatter } from "@/lib/content/schema";

/** Frontmatter-base (inline — sem tocar o fs). Campos de sistema plausíveis. */
const baseFrontmatter: Frontmatter = {
  id: "direcao/mapa-do-mercado",
  section: "direcao",
  entity: "mapa-do-mercado",
  title: "Mapa do mercado",
  status: "validated",
  summary:
    "O território, os players e as alternativas, as tendências e onde vale a pena jogar — a leitura de mercado que fundamenta a tese.",
  tags: ["mercado", "competição"],
  owner: "founder@businessos.dev",
  order: 1,
  created: "2026-05-01T10:00:00-03:00",
  updated: "2026-07-10T09:00:00-03:00",
  revision: 7,
  last_edited_by: "founder",
  ai_context: {
    purpose: "Mapa do mercado para orientar a tese de valor.",
    write_policy: "propose",
  },
  schema_version: 1,
};

/** Corpo Markdown com seções `##`, parágrafos e listas. */
const body = `# Mapa do mercado

## Território
O território é o de ferramentas de decisão para founders solo em estágio
pré-seed. A categoria mistura produtividade e inteligência de negócio, mas
resolve uma dor específica: clareza para decidir toda semana.

## Players e alternativas
As alternativas hoje são fragmentadas e improvisadas:

- Planilhas e documentos soltos no Notion
- Consultorias e mentorias avulsas, caras e pontuais
- Ferramentas genéricas de produtividade sem opinião de negócio

## Onde jogar
O espaço aberto é o de uma ferramenta com opinião — que transforma contexto
em decisão, e não só em mais um dashboard.`;

/** Doc completo com bloco `report` (KPIs + insights). */
const docComReport: EntityDoc = {
  path: "content/direcao/mapa-do-mercado.md",
  body,
  frontmatter: {
    ...baseFrontmatter,
    report: {
      generated_at: "2026-07-09",
      generated_by: "market-map",
      kpis: [
        {
          label: "Mercado LatAm",
          value: "US$ 4,2 bi",
          kind: "fact",
          source: "https://www.imarc.com/reports/latam-creator-economy",
          source_label: "IMARC 2024",
          note: "CAGR ~20,7% até 2033",
        },
        { label: "Segmento", value: "Founders solo", kind: "fact" },
        {
          label: "Meta de membros",
          value: "1.000",
          kind: "goal",
          note: "até dez/2026",
        },
        { label: "Renda-alvo", value: "R$ 40 mil/mês", kind: "goal" },
      ],
      insights: [
        {
          text: "A dor não é falta de dados, mas falta de decisão — o valor está na síntese acionável.",
        },
        {
          text: "O mercado LatAm cresce rápido, mas ainda é mal servido por ferramentas com opinião.",
          source: "https://www.imarc.com/reports/latam-creator-economy",
          source_label: "IMARC 2024",
        },
      ],
    },
  },
};

/**
 * Visualização de leitura de uma entidade — o "relatório" que o founder LÊ e
 * aprova (Server Component puro). Hero editorial, faixa de KPIs (do `report`,
 * ou derivada dos campos por-tipo, ou pescada do texto), callouts de insights e
 * o corpo como prosa rica. Sistema "Flux": tipografia Geist grande no hero,
 * tiles e callouts brancos sobre o canvas quente.
 */
const meta = {
  title: "Entities/EntityReport",
  component: EntityReport,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto w-full max-w-4xl">
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    doc: docComReport,
  },
} satisfies Meta<typeof EntityReport>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Relatório completo: hero + faixa de KPIs + insights + corpo. */
export const ComReport: Story = {};

/** Sem bloco `report`: sem KPIs nem insights — só hero e corpo editorial. */
export const SemReport: Story = {
  args: {
    doc: {
      ...docComReport,
      frontmatter: baseFrontmatter,
    },
  },
};

/** Rascunho vazio: sem KPIs, sem insights e sem conteúdo no corpo. */
export const SemConteudo: Story = {
  args: {
    doc: {
      path: "content/direcao/mapa-do-mercado.md",
      body: "# Mapa do mercado\n",
      frontmatter: {
        ...baseFrontmatter,
        status: "empty",
        summary: "",
        revision: 1,
      },
    },
  },
};
