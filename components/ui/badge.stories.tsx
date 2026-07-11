import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "@/components/ui/badge";

/**
 * Badge no design "Flux": sempre pill (rounded-full). `brand` = acento limao
 * (positivo/ativo); `brandMuted` = limao pastel para variacoes (ex.: "+5%");
 * `lavender` = acento secundario decorativo.
 */
const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Badge",
    variant: "default",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "default" },
};

export const Brand: Story = {
  args: { variant: "brand", children: "Ativo" },
};

export const BrandMuted: Story = {
  args: { variant: "brandMuted", children: "+5%" },
};

export const Lavender: Story = {
  args: { variant: "lavender", children: "Secundario" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Destructive: Story = {
  args: { variant: "destructive", children: "Bloqueado" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};
