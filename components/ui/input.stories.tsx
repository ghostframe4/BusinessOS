import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "@/components/ui/input";

/**
 * Input no design "Flux": pill (rounded-full) sobre bg-card, borda suave e
 * foco limao (ring-ring).
 */
const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  args: {
    placeholder: "Digite aqui...",
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: "BusinessOS" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Somente leitura" },
};
