import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

/** 404 global em pt-BR, no estilo do design system (docs/03 §9.1). */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-brand-muted">
        <FileQuestion className="size-8 text-foreground" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
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
