"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Tabs no estilo "Flux" — um segmented control pill (trilho `rounded-full`
 * off-white, aba ativa vira card branco com sombra). Implementação própria e
 * leve (sem dependência nova), acessível: `role=tablist/tab/tabpanel`, seleção
 * por setas ← →, e vínculo `aria-controls`/`aria-labelledby`.
 *
 * Uso:
 *   <Tabs defaultValue="empresas">
 *     <TabsList>
 *       <TabsTrigger value="empresas">Empresas</TabsTrigger>
 *       <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="empresas">…</TabsContent>
 *     <TabsContent value="pessoas">…</TabsContent>
 *   </Tabs>
 */

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  /** Base de id para vincular trigger↔painel via aria. */
  baseId: string;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) {
    throw new Error(`${component} precisa estar dentro de <Tabs>.`);
  }
  return ctx;
}

export interface TabsProps {
  /** Valor controlado. */
  value?: string;
  /** Valor inicial (modo não-controlado). */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({
  value: controlled,
  defaultValue,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const isControlled = controlled !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const value = isControlled ? controlled : internal;
  const baseId = React.useId();

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value, setValue, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  className?: string;
  children: React.ReactNode;
  /** Rótulo acessível do grupo de abas. */
  "aria-label"?: string;
}

export function TabsList({
  className,
  children,
  "aria-label": ariaLabel,
}: TabsListProps) {
  const listRef = React.useRef<HTMLDivElement>(null);

  // Navegação por teclado entre as abas (setas horizontais + Home/End).
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const triggers = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not([disabled])',
      ) ?? [],
    );
    if (triggers.length === 0) return;
    const current = triggers.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    event.preventDefault();
    let nextIndex = current;
    if (event.key === "ArrowRight") nextIndex = (current + 1) % triggers.length;
    else if (event.key === "ArrowLeft")
      nextIndex = (current - 1 + triggers.length) % triggers.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = triggers.length - 1;
    triggers[nextIndex]?.focus();
    triggers[nextIndex]?.click();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-secondary/70 p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function TabsTrigger({
  value,
  className,
  disabled,
  children,
}: TabsTriggerProps) {
  const { value: active, setValue, baseId } = useTabs("TabsTrigger");
  const selected = active === value;
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: active, baseId } = useTabs("TabsContent");
  const selected = active === value;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={!selected}
      tabIndex={0}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {selected ? children : null}
    </div>
  );
}
