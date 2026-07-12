"use client";

import type * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface AiUnavailableButtonProps {
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}

/**
 * Botao de IA no estado DESABILITADO (sem ANTHROPIC_API_KEY): pill desabilitado
 * com tooltip explicando o porque. O `<span>` embrulha o botao para que o Radix
 * Tooltip receba hover mesmo com o botao `disabled` (que ignora pointer events).
 */
export function AiUnavailableButton({
  children,
  variant = "outline",
  size,
  className,
}: AiUnavailableButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Button
              type="button"
              variant={variant}
              size={size}
              className={className}
              disabled
              aria-disabled
            >
              {children}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          IA nao configurada — adicione ANTHROPIC_API_KEY
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
