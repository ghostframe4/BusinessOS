import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { OpportunityCard } from "@/components/leads/opportunity-card";
import type { Company } from "@/lib/leads/types";

/** Fixture-base de Company (inline — sem tocar o fs). */
const baseCompany: Company = {
  id: "nuvem-contabil",
  name: "Nuvem Contábil",
  legalName: "Nuvem Contábil Ltda",
  cnpj: "12345678000190",
  sector: "Serviços contábeis",
  city: "Belo Horizonte",
  size: "100–200 funcionários",
  website: "nuvemcontabil.com.br",
  source: "LinkedIn",
  stage: "qualified",
  score: 82,
  foundBy: "prospector-bh",
  addedAt: "2026-07-09",
  note: "Publicou sobre automação do fechamento de mês. Fit alto com a oferta.",
};

/**
 * Card de uma oportunidade (empresa/PJ) no kanban do sistema "Flux": card branco
 * `rounded-2xl` sobre o canvas off-white quente. Empresa + setor/cidade no topo,
 * a barra de fit (limão ≥80, lavanda ≥60, neutro abaixo) e a nota do agente no
 * meio, CNPJ (ou origem) + agente que trouxe + data no rodapé.
 */
const meta = {
  title: "Leads/OpportunityCard",
  component: OpportunityCard,
  parameters: {
    layout: "centered",
  },
  args: {
    company: baseCompany,
  },
  decorators: [
    (Story) => (
      // canvas off-white quente para o card branco + sombra lerem bem
      <div className="rounded-3xl bg-background p-8">
        <div className="w-72">
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof OpportunityCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Fit alto (≥80): barra limão. */
export const HighFit: Story = {
  args: {
    company: { ...baseCompany, score: 91, stage: "negotiating" },
  },
};

/** Fit médio (≥60): barra lavanda. */
export const MediumFit: Story = {
  args: {
    company: { ...baseCompany, score: 67, stage: "contacted" },
  },
};

/** Fit baixo (<60): barra neutra. */
export const LowFit: Story = {
  args: {
    company: { ...baseCompany, score: 34, stage: "new" },
  },
};

/** Sem score: a barra de fit some. */
export const WithoutScore: Story = {
  args: {
    company: { ...baseCompany, score: undefined },
  },
};

/** Sem CNPJ, nota nem agente: rodapé só com origem + data. */
export const Minimal: Story = {
  args: {
    company: {
      ...baseCompany,
      cnpj: undefined,
      note: undefined,
      foundBy: undefined,
      score: undefined,
    },
  },
};

/** Estado arrastando: o card esmaece (opacity-50). */
export const Dragging: Story = {
  args: {
    dragging: true,
    dragProps: { draggable: true },
  },
};

/** Ganho: estágio terminal. */
export const Won: Story = {
  args: {
    company: { ...baseCompany, stage: "won", score: 88 },
  },
};

/** Galeria de oportunidades em diferentes estágios/fits. */
export const Gallery: Story = {
  render: () => {
    const companies: Company[] = [
      baseCompany,
      {
        ...baseCompany,
        id: "loja-franca",
        name: "Loja Franca",
        legalName: undefined,
        cnpj: undefined,
        sector: "Varejo",
        city: "Contagem",
        source: "Google Maps",
        stage: "new",
        score: 45,
        foundBy: "scout",
        addedAt: "2026-07-10",
        note: "Rede regional em expansão. Vale um primeiro contato.",
      },
      {
        ...baseCompany,
        id: "vertice-log",
        name: "Vértice Log",
        legalName: undefined,
        cnpj: undefined,
        sector: "Logística",
        city: "Betim",
        source: "Indicação",
        stage: "negotiating",
        score: 94,
        foundBy: undefined,
        addedAt: "2026-07-06",
        note: undefined,
      },
    ];
    return (
      <div className="flex flex-wrap gap-4">
        {companies.map((company) => (
          <div key={company.id} className="w-72">
            <OpportunityCard company={company} />
          </div>
        ))}
      </div>
    );
  },
};
