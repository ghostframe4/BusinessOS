import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Sheet no design "Flux": painel flutuante em bg-card, sombra suave e cantos
 * internos arredondados (rounded-l/r-3xl), com foco limao (ring-ring). Composto
 * por Root/Trigger/Content/Header/Title/Description/Footer — as stories montam a
 * composicao completa e abrem por default para aparecer no canvas.
 */
const meta = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Direita: Story = {
  render: () => (
    <Sheet open>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Editar entidade</SheetTitle>
          <SheetDescription>
            Altere o titulo e o resumo. A proposta entra como needs_review.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="sheet-title">Titulo</Label>
            <Input id="sheet-title" defaultValue="Mapa do mercado" />
          </div>
        </div>
        <SheetFooter>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="brand">Propor mudanca</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

export const Esquerda: Story = {
  render: () => (
    <Sheet open>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Navegacao</SheetTitle>
          <SheetDescription>Secoes do BusinessOS.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

export const ComGatilho: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir painel</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Detalhes</SheetTitle>
          <SheetDescription>
            Contexto completo da entidade selecionada.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="ghost">Fechar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};
