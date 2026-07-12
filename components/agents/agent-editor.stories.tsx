import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AgentEditor } from "@/components/agents/agent-editor";
import type { AgentDoc } from "@/lib/agents/repository";

/** AgentDoc mock (inline — sem tocar o fs). */
const agent: AgentDoc = {
  slug: "market-map",
  name: "market-map",
  description:
    "Estrutura o mapa do mercado: território, players e alternativas, tendências e onde jogar.",
  tools: "Read, Bash, WebSearch",
  data: {
    name: "market-map",
    description: "Estrutura o mapa do mercado.",
    tools: "Read, Bash, WebSearch",
  },
  systemPrompt: `Voce e o agente \`agent:market-map\`.

## Regra de ouro
NUNCA edite arquivos em \`content/\` diretamente. Use os CLIs \`pnpm agent:read\`
e \`pnpm agent:write\`.

## Alcada
Escreve apenas em \`direcao/mapa-do-mercado\`. Le outras secoes so para contexto.
`,
};

/**
 * Editor do system prompt de um subagente (`.claude/agents/<slug>.md`). Sistema
 * "Flux": campos full-width, botão "Salvar" limão (desabilitado até haver
 * mudança). `name` e `tools` são só leitura (imutáveis aqui); `description` e o
 * system prompt (corpo Markdown) são editáveis e salvos via `saveAgent` — que
 * resolve para o stub de story. `embedded` troca o chrome das seções (borda
 * sutil, para uso dentro de modal). O form em si não tem `max-w` — só o
 * decorator.
 */
const meta = {
  title: "Agents/AgentEditor",
  component: AgentEditor,
  parameters: {
    layout: "fullscreen",
    nextjs: { appDirectory: true },
  },
  args: {
    agent,
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
} satisfies Meta<typeof AgentEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Modo página: cards com sombra, botão "Voltar". */
export const Padrao: Story = {};

/** Modo embutido (dentro de modal): chrome mais leve, botão "Fechar". */
export const Embedded: Story = {
  args: {
    embedded: true,
    onSaved: () => {},
    onCancel: () => {},
  },
};

/** Agente sem ferramentas concedidas: o campo mostra o traço "—". */
export const SemFerramentas: Story = {
  args: {
    agent: { ...agent, tools: "" },
  },
};
