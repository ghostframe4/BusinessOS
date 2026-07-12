import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReportSection } from "@/components/entities/report/report-section";
import type { MdBlock } from "@/lib/content/report-format";

/**
 * Seção `##` do corpo renderizada como CARD (sistema "Flux"). Card branco
 * `rounded-3xl` sobre o canvas quente, com heading forte (Geist) e, dentro,
 * cada informação num container claro — nunca texto solto no canvas:
 * parágrafos, listas não-ordenadas (bullet lavanda), listas ordenadas (número
 * tabular) e tabelas GFM com rolagem horizontal e zebra sutil. O Markdown
 * inline (`**negrito**`, `*itálico*`, `` `código` ``) é renderizado sem libs.
 */
const meta = {
  title: "Report/ReportSection",
  component: ReportSection,
  parameters: {
    layout: "padded",
  },
  args: {
    heading: "Onde jogar",
    blocks: [
      {
        type: "p",
        text: "O território mais promissor é o de **criadores B2B** em LatAm — menos saturado e com disposição a pagar por *clareza de decisão*.",
      },
    ],
  },
  decorators: [
    (Story) => (
      // fundo canvas quente para o card branco + sombra lerem bem
      <div className="rounded-3xl bg-background p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReportSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Só parágrafos, com Markdown inline (negrito, itálico e código). */
export const Paragrafos: Story = {
  args: {
    heading: "Território",
    blocks: [
      {
        type: "p",
        text: "O mercado se organiza em torno de **três frentes**: ferramentas de publicação, monetização e analytics.",
      },
      {
        type: "p",
        text: "A brecha está no meio — ninguém trata a *decisão semanal* do criador como produto. O campo `north_star` fica sem dono.",
      },
    ] satisfies MdBlock[],
  },
};

/** Lista não-ordenada: bullets lavanda. */
export const ListaNaoOrdenada: Story = {
  args: {
    heading: "Alternativas atuais",
    blocks: [
      {
        type: "ul",
        ordered: false,
        items: [
          "Planilhas manuais mantidas à mão",
          "Consultorias pontuais e caras",
          "Ferramentas genéricas de produtividade (**Notion**, Trello)",
        ],
      },
    ] satisfies MdBlock[],
  },
};

/** Lista ordenada: numeração tabular. */
export const ListaOrdenada: Story = {
  args: {
    heading: "Sequência de apostas",
    blocks: [
      {
        type: "ul",
        ordered: true,
        items: [
          "Validar a tese com 5 founders solo",
          "Fechar a oferta-hipótese e o preço",
          "Rodar o primeiro ciclo pago",
        ],
      },
    ] satisfies MdBlock[],
  },
};

/** Tabela GFM: cabeçalho, zebra sutil e rolagem horizontal em telas estreitas. */
export const Tabela: Story = {
  args: {
    heading: "Priorização de problemas",
    blocks: [
      {
        type: "table",
        headers: ["Problema", "Frequência", "Dor"],
        rows: [
          ["Decisão semanal de foco", "Alta", "**Alta**"],
          ["Consolidar aprendizado de campo", "Média", "Média"],
          ["Acompanhar caixa", "Baixa", "Alta"],
        ],
      },
    ] satisfies MdBlock[],
  },
};

/** Seção rica: parágrafo, lista e tabela juntos num só card. */
export const Mista: Story = {
  args: {
    heading: "Onde jogar",
    blocks: [
      {
        type: "p",
        text: "A leitura consolidada aponta para **um** território óbvio e duas apostas de suporte.",
      },
      {
        type: "ul",
        ordered: false,
        items: [
          "Foco: criadores B2B em LatAm",
          "Anti-perfil: hobbistas sem monetização",
        ],
      },
      {
        type: "table",
        headers: ["Frente", "Prioridade"],
        rows: [
          ["Decisão semanal", "1"],
          ["Monetização", "2"],
          ["Analytics", "3"],
        ],
      },
    ] satisfies MdBlock[],
  },
};

/** Galeria: várias seções empilhadas, como aparecem no relatório de leitura. */
export const Galeria: Story = {
  render: () => {
    const sections: { heading: string; blocks: MdBlock[] }[] = [
      {
        heading: "Território",
        blocks: [
          {
            type: "p",
            text: "**Criadores B2B** em LatAm — menos saturado, mais disposto a pagar.",
          },
        ],
      },
      {
        heading: "Sequência de apostas",
        blocks: [
          {
            type: "ul",
            ordered: true,
            items: [
              "Validar a tese com 5 founders",
              "Fechar a oferta-hipótese",
              "Rodar o primeiro ciclo pago",
            ],
          },
        ],
      },
    ];
    return (
      <div className="flex flex-col gap-6">
        {sections.map((s) => (
          <ReportSection key={s.heading} heading={s.heading} blocks={s.blocks} />
        ))}
      </div>
    );
  },
};
