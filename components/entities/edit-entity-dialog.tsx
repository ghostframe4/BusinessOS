"use client";

import type * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { EntityForm } from "@/components/entities/entity-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { EntityDoc } from "@/lib/content/schema";

/**
 * Modal de edição que envolve o `EntityForm`. Abre por um botão "Editar" e,
 * ao salvar com sucesso, fecha e revalida a página de leitura (`router.refresh`)
 * para refletir a nova revisão. O Radix Dialog cuida de focus trap/Esc.
 */
export function EditEntityDialog({
  doc,
  aiEnabled = true,
}: {
  doc: EntityDoc;
  /** IA ligada no runtime? Repassada ao form (botão "Gerar briefing"). */
  aiEnabled?: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleSaved(): void {
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="size-4" aria-hidden />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar {doc.frontmatter.title}</DialogTitle>
          <DialogDescription>
            Ajuste os campos e salve. Suas alterações entram como uma nova revisão.
          </DialogDescription>
        </DialogHeader>

        <EntityForm
          doc={doc}
          aiEnabled={aiEnabled}
          onSaved={handleSaved}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
