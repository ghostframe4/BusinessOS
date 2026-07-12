import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { QuestionnaireWizard } from "@/components/entities/questionnaire-wizard";
import type { Question } from "@/lib/content/questionnaire";

/** Perguntas do questionário (inline — sem tocar o fs). */
const questions: Question[] = [
  {
    heading: "Território",
    label: "Qual é o território deste mercado?",
    hint: "A categoria ampla onde você joga — pense no guarda-chuva.",
    placeholder: "Ex.: ferramentas de decisão para founders solo",
  },
  {
    heading: "Players e alternativas",
    label: "Quem são os players e as alternativas?",
    hint: "Concorrentes diretos e o que as pessoas usam hoje no lugar.",
    placeholder: "Ex.: planilhas, Notion, consultorias avulsas",
  },
  {
    heading: "Tendências",
    label: "Quais tendências movem este mercado agora?",
    hint: "Forças que mudam o jogo nos próximos anos.",
    placeholder: "Ex.: IA barateando análise, mais solo-founders",
  },
];

/**
 * Fluxo de onboarding do questionário (docs/03 §9.3): uma pergunta por vez, com
 * barra de progresso limão, enunciado à esquerda e resposta ampla à direita, e
 * navegação Voltar / Próxima (ou "Pular" quando vazio). Na última pergunta,
 * "Revisar respostas" chama `onFinish`. As respostas vivem no estado do form
 * pai — aqui um wrapper com `useState` simula esse pai para o wizard ficar
 * interativo. Card branco `rounded-3xl` no canvas quente (sistema "Flux").
 */
const meta = {
  title: "Entities/QuestionnaireWizard",
  component: QuestionnaireWizard,
  parameters: {
    layout: "fullscreen",
  },
  // Args-base só para satisfazer o tipo (props obrigatórias); as stories usam
  // `render` com o WizardHarness stateful, então estes valores são ignorados.
  args: {
    entityTitle: "Mapa do mercado",
    questions,
    answers: {},
    onAnswer: () => {},
    onFinish: () => {},
    onEditAll: () => {},
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
} satisfies Meta<typeof QuestionnaireWizard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Wrapper com estado — simula o form pai que detém as respostas. */
function WizardHarness({
  initialAnswers = {},
}: {
  initialAnswers?: Record<string, string>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  return (
    <QuestionnaireWizard
      entityTitle="Mapa do mercado"
      questions={questions}
      answers={answers}
      onAnswer={(heading, value) =>
        setAnswers((prev) => ({ ...prev, [heading]: value }))
      }
      onFinish={() => {}}
      onEditAll={() => {}}
    />
  );
}

/** Início do fluxo: primeira pergunta, tudo vazio. */
export const PrimeiroPasso: Story = {
  render: () => <WizardHarness />,
};

/** Fluxo em andamento: primeira pergunta já respondida (barra avança). */
export const ComRespostas: Story = {
  render: () => (
    <WizardHarness
      initialAnswers={{
        Território:
          "Ferramentas de decisão para founders solo em estágio pré-seed.",
      }}
    />
  ),
};
