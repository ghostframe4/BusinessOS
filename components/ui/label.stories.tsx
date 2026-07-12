import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Label no design "Flux": rotulo discreto (text-sm, font-medium) em tipografia
 * Geist, associado a um campo via `htmlFor`. Acompanha o pill de Input/Textarea
 * sobre bg-card.
 */
const meta = {
  title: "UI/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid w-80 gap-2">
      <Label htmlFor="entity-title">Titulo da entidade</Label>
      <Input id="entity-title" placeholder="Perfil ideal de cliente" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="grid w-80 gap-2">
      <Label htmlFor="entity-readonly">Campo bloqueado</Label>
      <Input id="entity-readonly" disabled defaultValue="Somente leitura" />
    </div>
  ),
};
