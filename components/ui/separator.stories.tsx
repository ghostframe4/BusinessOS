import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Separator } from "@/components/ui/separator";

/**
 * Separator no design "Flux": fio sutil (bg-border) que respira entre blocos.
 * Aceita orientacao horizontal (padrao) e vertical, usado para agrupar meta e
 * acoes na tipografia Geist.
 */
const meta = {
  title: "UI/Separator",
  component: Separator,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Direcao</h4>
        <p className="text-sm text-muted-foreground">
          Mapa do mercado, ICP e tese de valor.
        </p>
      </div>
      <Separator />
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">Validacao</h4>
        <p className="text-sm text-muted-foreground">
          Oferta e primeiros clientes.
        </p>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-4 text-sm">
      <span>Ler</span>
      <Separator orientation="vertical" />
      <span>Propor</span>
      <Separator orientation="vertical" />
      <span>Aprovar</span>
    </div>
  ),
};
