"use client";

import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type EntityView = "grid" | "list";

export interface ViewToggleProps {
  /** Visualização atual (fonte de verdade = search param `?view`). */
  value: EntityView;
  className?: string;
}

/**
 * Alterna grid ↔ lista com um único `Select` (docs/03 §7.3 e docs/04 §12).
 * URL é a fonte de verdade (`router.replace(?view=…)`); `localStorage` guarda a
 * preferência para semear o default entre sessões.
 */
export function ViewToggle({ value, className }: ViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  function handleChange(next: string) {
    const view: EntityView = next === "list" ? "list" : "grid";
    try {
      localStorage.setItem("businessos.view", view);
    } catch {
      // localStorage indisponível — segue apenas pela URL.
    }
    router.replace(`${pathname}?view=${view}`, { scroll: false });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label htmlFor="view-toggle" className="sr-only">
        Visualização
      </label>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger
          id="view-toggle"
          aria-label="Visualização"
          className="h-10 w-36 rounded-full text-sm"
        >
          <SelectValue placeholder="Visualização" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="grid">
            <span className="flex items-center gap-2">
              <LayoutGrid className="size-4" aria-hidden />
              Grade
            </span>
          </SelectItem>
          <SelectItem value="list">
            <span className="flex items-center gap-2">
              <List className="size-4" aria-hidden />
              Lista
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
