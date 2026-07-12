import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { EntityForm } from "@/components/entities/entity-form";
import type { EntityDoc, Frontmatter } from "@/lib/content/schema";

/** Frontmatter-base (inline — sem tocar o fs). Campos de sistema plausíveis. */
const baseFrontmatter: Frontmatter = {
  id: "direcao/mapa-do-mercado",
  section: "direcao",
  entity: "mapa-do-mercado",
  title: "Mapa do mercado",
  status: "in_progress",
  summary:
    "O território, os players e as alternativas, as tendências e onde vale a pena jogar.",
  tags: ["mercado", "competição"],
  owner: "founder@businessos.dev",
  order: 1,
  created: "2026-05-01T10:00:00-03:00",
  updated: "2026-07-10T09:00:00-03:00",
  revision: 5,
  last_edited_by: "founder",
  ai_context: {
    purpose: "Mapa do mercado para orientar a tese de valor.",
    write_policy: "propose",
  },
  schema_version: 1,
};

/** Corpo com todas as respostas preenchidas (entra em modo revisão). */
const filledBody = `# Mapa do mercado

## Território
Software de gestão para serviços jurídicos B2B no Brasil.

## Players e alternativas
ERPs jurídicos legados, planilhas e o próprio contador.

## Tendências
IA aplicada a documentos e pressão por redução de custos.

## Onde jogamos
Escritórios de 3 a 15 advogados; fora disso, não.
`;

/** Corpo só com os placeholders `_A preencher._` (equivale a "sem resposta"). */
const emptyBody = `# Mapa do mercado

## Território
_A preencher._

## Players e alternativas
_A preencher._

## Tendências
_A preencher._

## Onde jogamos
_A preencher._
`;

const filledDoc: EntityDoc = {
  path: "content/direcao/mapa-do-mercado.md",
  body: filledBody,
  frontmatter: baseFrontmatter,
};

/**
 * Form de edição de uma EntityDoc (docs/03 §9.3 e docs/04 §7.1). Sistema "Flux":
 * campos full-width em cards brancos `rounded-3xl`, botão "Salvar" limão. Dois
 * modos sobre o mesmo estado de respostas: `wizard` (onboarding, uma pergunta
 * por vez — entrada padrão quando a entidade está vazia) e `review` (página
 * completa: metadados + todas as respostas + gerar briefing). A action de save
 * resolve para o stub de story. O form em si não tem `max-w` — só o decorator.
 */
const meta = {
  title: "Entities/EntityForm",
  component: EntityForm,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: {
    doc: filledDoc,
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
} satisfies Meta<typeof EntityForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Entidade preenchida: modo revisão com metadados e respostas editáveis. */
export const Preenchida: Story = {};

/** Entidade nova (`status: empty`, sem respostas): entra no wizard guiado. */
export const NovaEntidade: Story = {
  args: {
    doc: {
      path: "content/direcao/mapa-do-mercado.md",
      body: emptyBody,
      frontmatter: {
        ...baseFrontmatter,
        status: "empty",
        summary: "",
        revision: 1,
      },
    },
  },
};

/**
 * Entidade `founder_only` (sem agente responsável): o form continua editável,
 * mas "Gerar briefing" pede só o texto de volta (nenhum agente propõe).
 */
export const FounderOnly: Story = {
  args: {
    doc: {
      path: "content/founder/estilo-de-vida.md",
      body: `# Estilo de vida

## Vida que o negócio sustenta
Trabalhar de casa, manhãs livres com a família, sem viver de reuniões.

## Tempo
25–30h/semana, sem trabalhar fins de semana.

## Renda
Piso de R$ 15 mil/mês; sucesso a partir de R$ 40 mil/mês.

## Liberdade e inegociáveis
Autonomia total de agenda; morar onde eu quiser.
`,
      frontmatter: {
        ...baseFrontmatter,
        id: "founder/estilo-de-vida",
        section: "founder",
        entity: "estilo-de-vida",
        title: "Estilo de vida",
        summary: "A vida que o negócio precisa sustentar.",
        tags: ["founder"],
        ai_context: {
          purpose: "Estilo de vida-alvo do founder.",
          write_policy: "founder_only",
        },
      },
    },
  },
};
