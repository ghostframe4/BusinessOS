"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * Botão de alternância claro/escuro (docs/03 §7: canto superior direito).
 * Client component; espera a montagem antes de decidir o ícone para evitar
 * divergência de hidratação (o tema real só é conhecido no cliente).
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Tema claro" : "Tema escuro"}
    >
      {/* Sem `mounted` o ícone poderia divergir entre servidor e cliente. */}
      {mounted && isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
