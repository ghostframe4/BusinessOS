import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Tooltip no design "Flux": balao pill (rounded-full) em bg-primary com texto
 * limao-invertido (primary-foreground), tipografia Geist. Composto por
 * Provider/Root/Trigger/Content — as stories montam a composicao completa e
 * usam `defaultOpen`/`delayDuration={0}` para renderizar sem hover.
 */
const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Aberto: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <Button variant="outline">Propor mudanca</Button>
        </TooltipTrigger>
        <TooltipContent>Voce propoe; o founder aprova.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const AoPassarOMouse: Story = {
  render: () => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost">Passe o mouse</Button>
        </TooltipTrigger>
        <TooltipContent>Dica visivel no hover.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
