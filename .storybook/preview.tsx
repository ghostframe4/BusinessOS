import type { Preview } from "@storybook/nextjs-vite";
import React from "react";
import { fontVariables } from "../app/fonts";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' - mostra violacoes a11y so na UI de teste
      // 'error' - falha o CI em violacoes a11y
      // 'off' - pula as checagens a11y
      test: "todo",
    },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: "Tema (light/dark) — valida o P&B em ambos",
      defaultValue: "light",
      toolbar: {
        title: "Tema",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "";
      return (
        <div className={`${fontVariables} ${theme}`}>
          <div className="min-h-24 bg-background p-6 font-sans text-foreground">
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;
