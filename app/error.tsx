"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Boundary de erro global em pt-BR, no estilo do design system (docs/03 §9). */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <TriangleAlert className="size-10 text-destructive" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Algo deu errado
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Não foi possível carregar este conteúdo. Tente novamente.
        </p>
      </div>
      <Button onClick={reset} className="mt-2">
        Tentar de novo
      </Button>
    </div>
  );
}
