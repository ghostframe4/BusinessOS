import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { EditEntityDialog } from "@/components/entities/edit-entity-dialog";
import type { EntityDoc, Frontmatter } from "@/lib/content/schema";

/** Frontmatter-base (inline — sem tocar o fs). */
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

const doc: EntityDoc = {
  path: "content/direcao/mapa-do-mercado.md",
  body: `# Mapa do mercado

## Território
Software de gestão para serviços jurídicos B2B no Brasil.

## Players e alternativas
ERPs jurídicos legados, planilhas e o próprio contador.

## Tendências
IA aplicada a documentos e pressão por redução de custos.

## Onde jogamos
Escritórios de 3 a 15 advogados; fora disso, não.
`,
  frontmatter: baseFrontmatter,
};

/**
 * Modal de edição que envolve o `EntityForm` (docs/03 §9.3). Sistema "Flux":
 * botão "Editar" (outline) que abre um Dialog (card branco `rounded-3xl`,
 * `max-w-3xl`) com o form completo; ao salvar com sucesso fecha e revalida. O
 * `open` é interno (não é prop), então a story `Aberto` usa um `play` que clica
 * "Editar" para revelar o modal. A action de save resolve para o stub de story.
 */
const meta = {
  title: "Entities/EditEntityDialog",
  component: EditEntityDialog,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
  },
  args: {
    doc,
  },
} satisfies Meta<typeof EditEntityDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Estado fechado: só o botão "Editar". */
export const Fechado: Story = {};

/** Modal aberto com o form de edição dentro (aberto via play). */
export const Aberto: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /editar/i }));
    const dialog = within(await within(document.body).findByRole("dialog"));
    await expect(
      dialog.getByText(/editar mapa do mercado/i),
    ).toBeInTheDocument();
  },
};
