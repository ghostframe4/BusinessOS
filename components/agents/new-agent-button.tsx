"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { AgentCreateForm } from "@/components/agents/agent-create-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Botão "Novo agente" que abre o formulário de criação num modal (mesmo padrão
 * da edição em `AgentsGrid`), em vez de navegar para uma página dedicada. Ao
 * criar com sucesso, fecha e revalida a rota via `router.refresh()` — o card
 * novo aparece na grade sem sair da tela.
 */
export function NewAgentButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="brand" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Novo agente
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>Novo agente</DialogTitle>
            <DialogDescription>
              Cria um arquivo em <code>.claude/agents/</code>. Você pode ajustar
              o system prompt depois.
            </DialogDescription>
          </DialogHeader>

          <AgentCreateForm
            embedded
            onCancel={() => setOpen(false)}
            onCreated={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
