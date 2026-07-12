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
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <TriangleAlert className="size-8 text-destructive" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Algo deu errado
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Não foi possível carregar este conteúdo. Tente novamente.
        </p>
      </div>
      <Button onClick={reset} variant="brand" className="mt-2">
        Tentar de novo
      </Button>
    </div>
  );
}
