import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Textarea } from "@/components/ui/textarea";

/**
 * Textarea no design "Flux": superficie rounded-2xl sobre bg-muted, borda suave
 * e foco limao (ring-ring). Tipografia Geist com leading relaxado para textos
 * longos.
 */
const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  args: {
    placeholder: "Escreva aqui...",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: {
    defaultValue:
      "BusinessOS e um OS de decisao para founder: cada entidade do negocio vive como um arquivo Markdown com frontmatter.",
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Somente leitura" },
};

export const Longa: Story = {
  args: { rows: 8, placeholder: "Descreva a tese de valor em detalhe..." },
};
