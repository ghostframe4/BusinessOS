import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton no design "Flux": placeholder rounded-xl com pulso suave sobre
 * bg-primary/10. Usado durante o carregamento das entidades, mantendo o ritmo
 * arredondado do sistema.
 */
const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Linha: Story = {
  render: () => <Skeleton className="h-4 w-64" />,
};

export const Quadrado: Story = {
  render: () => <Skeleton className="h-24 w-24 rounded-2xl" />,
};

export const Card: Story = {
  render: () => (
    <div className="flex w-80 items-center gap-4 rounded-3xl bg-card p-6 shadow-sm">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  ),
};
