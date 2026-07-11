import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

/** 404 global em pt-BR, no estilo do design system (docs/03 §9.1). */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <FileQuestion className="size-10 text-neutral-400" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Página não encontrada
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          O conteúdo que você procura não existe ou foi movido.
        </p>
      </div>
      <Button asChild className="mt-2">
        <Link href="/founder">Voltar ao início</Link>
      </Button>
    </div>
  );
}
