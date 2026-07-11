"use client";

import type { ReactNode } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Provider de tema (next-themes) para alternar claro/escuro via classe `.dark`
 * no `<html>` (docs/03 §design P&B: o modo escuro é a inversão limpa da paleta).
 * Client component; envolve toda a árvore no root layout.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
