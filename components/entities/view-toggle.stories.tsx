import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ViewToggle } from "@/components/entities/view-toggle";

/**
 * Alterna grade ↔ lista com um único `Select` (docs/03 §7.3 e docs/04 §12).
 * A URL é a fonte de verdade (`router.replace(?view=…)`); em Storybook o router
 * do App Router é mockado (`nextjs.appDirectory`), então a troca é registrada
 * como action sem navegação real.
 */
const meta = {
  title: "Entities/ViewToggle",
  component: ViewToggle,
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/direcao",
      },
    },
  },
  args: {
    value: "grid",
  },
} satisfies Meta<typeof ViewToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Grade: Story = {
  args: { value: "grid" },
};

export const Lista: Story = {
  args: { value: "list" },
};
