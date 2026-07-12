import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";

import { ThemeToggle } from "@/components/layout/theme-toggle";

/**
 * Botão de alternância claro/escuro (docs/03 §7) — sistema visual "Flux".
 * Pequeno botão `ghost` redondo do canto superior direito da topbar: ícone de
 * lua no tema claro (canvas off-white quente) e de sol no escuro. É client
 * component: só decide o ícone após montar, para não divergir na hidratação.
 * O decorator envolve num `ThemeProvider` (`next-themes`, `attribute="class"`)
 * para que `useTheme` resolva o tema e o clique alterne de fato.
 */
const meta = {
  title: "Layout/ThemeToggle",
  component: ThemeToggle,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" enableSystem defaultTheme="light">
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Estado padrão: clique alterna entre claro e escuro (via `next-themes`). */
export const Default: Story = {};

/** Inicia no tema escuro: o botão mostra o sol para voltar ao claro. */
export const StartsDark: Story = {
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" enableSystem defaultTheme="dark">
        <Story />
      </ThemeProvider>
    ),
  ],
};
