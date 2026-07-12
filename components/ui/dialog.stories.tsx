import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Dialog no design "Flux": superficie flutuante bem arredondada (rounded-3xl)
 * sobre bg-card, com sombra suave e foco limao (ring-ring). Composto por
 * Root/Trigger/Content/Header/Title/Description/Footer — as stories montam a
 * composicao completa. A story padrao abre por default para aparecer no canvas.
 */
const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Aberto: Story = {
  render: () => (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar entidade</DialogTitle>
          <DialogDescription>
            Ajuste o titulo e o resumo. Voce propoe; o founder aprova na UI.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="dialog-title">Titulo</Label>
            <Input id="dialog-title" defaultValue="Perfil ideal de cliente" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dialog-summary">Resumo</Label>
            <Input id="dialog-summary" placeholder="Uma frase clara..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="brand">Propor mudanca</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ComGatilho: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Abrir dialogo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Arquivar entidade</DialogTitle>
          <DialogDescription>
            Esta acao move o card para o arquivo. Voce pode restaurar depois.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancelar</Button>
          </DialogClose>
          <Button variant="destructive">Arquivar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
