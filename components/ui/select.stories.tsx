import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Select no design "Flux": trigger pill coerente com o input e content
 * flutuante bem arredondado (rounded-2xl), foco limao.
 */
const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a secao" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="direcao">Direcao</SelectItem>
          <SelectItem value="validacao">Validacao</SelectItem>
          <SelectItem value="caixa">Caixa</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
