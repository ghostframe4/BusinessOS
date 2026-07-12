"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export interface ConversationRailProps {
  conversations: Conversation[];
}

/**
 * Segundo painel da página Principal (SPEC): rail de conversas como uma
 * "gaveta" branca. Diferente da sidebar escura, ela é `bg-card` e desliza
 * por BAIXO da sidebar principal (`z-10` < `z-20`, com `-ml-6` a encostando
 * e escondendo a borda esquerda atrás dela) — cantos arredondados só à
 * direita (`rounded-r-3xl`). Botão "Nova conversa" no topo, lista rolável e
 * exclusão inline no hover — sem `window.confirm` (dialogs travam o event loop).
 */
export function ConversationRail({ conversations }: ConversationRailProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("delete failed");

      // Se a conversa aberta foi excluída, volta para a página vazia.
      if (pathname === `/principal/${id}`) {
        router.replace("/principal");
      }
      startTransition(() => router.refresh());
      toast.success("Conversa excluída.");
    } catch {
      toast.error("Não foi possível excluir a conversa.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <aside className="sticky top-0 z-10 -ml-11 h-dvh w-[calc(17rem+2.75rem)] shrink-0 py-3 pr-3">
      <div className="flex h-full animate-drawer-in flex-col rounded-r-3xl border-y border-r border-border bg-card py-5 pl-14 pr-4 text-foreground shadow-[8px_0_28px_-16px_rgba(0,0,0,0.35)] motion-reduce:animate-none">
        <div className="flex shrink-0 items-center justify-between gap-2 px-2 pb-4">
          <span className="text-sm font-semibold tracking-tight">Conversas</span>
          <Button
            asChild
            size="icon"
            variant="ghost"
            aria-label="Nova conversa"
            className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Link href="/principal">
              <Plus className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>

        <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Nenhuma conversa ainda. Comece uma nova.
            </p>
          ) : (
            conversations.map((conv) => {
              const active = pathname === `/principal/${conv.id}`;
              const isDeleting = deletingId === conv.id;
              return (
                <div
                  key={conv.id}
                  className={cn(
                    "group flex h-10 items-center gap-2 rounded-full pl-3.5 pr-1.5 text-sm transition-colors",
                    active
                      ? "bg-muted font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isDeleting && "opacity-50",
                  )}
                >
                  <Link
                    href={`/principal/${conv.id}`}
                    aria-current={active ? "page" : undefined}
                    className="min-w-0 flex-1 truncate outline-none"
                  >
                    {conv.title}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Excluir "${conv.title}"`}
                    disabled={isDeleting || pending}
                    onClick={() => handleDelete(conv.id)}
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity",
                      "hover:bg-muted-foreground/10 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100",
                      active && "opacity-70",
                    )}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </div>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
}
