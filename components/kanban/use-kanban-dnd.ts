"use client";

import { useState, type DragEvent } from "react";

/**
 * Drag-and-drop entre colunas de um kanban, sobre a API nativa de HTML5 (sem
 * dependências). O hook cuida só do "quem está sendo arrastado" e "sobre qual
 * coluna" — a mutação real fica a cargo do board, via `onMove(itemId, column)`.
 *
 * Uso:
 *   const dnd = useKanbanDnd((id, col) => setItems(mover(id, col)));
 *   <section {...dnd.columnProps(colKey)} data-over={dnd.overColumn === colKey}>
 *     <Card {...dnd.cardProps(item.id)} dragging={dnd.draggingId === item.id} />
 */
export function useKanbanDnd(
  onMove: (itemId: string, toColumn: string) => void,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  /** Props para cada card arrastável. */
  function cardProps(itemId: string) {
    return {
      draggable: true,
      onDragStart: (e: DragEvent) => {
        setDraggingId(itemId);
        e.dataTransfer.effectAllowed = "move";
        // Fallback caso o estado se perca entre janelas/re-render.
        e.dataTransfer.setData("text/plain", itemId);
      },
      onDragEnd: () => {
        setDraggingId(null);
        setOverColumn(null);
      },
    };
  }

  /** Props para cada coluna (zona de soltar). */
  function columnProps(columnKey: string) {
    return {
      onDragOver: (e: DragEvent) => {
        // Sem card em voo -> não é um drag nosso; ignora.
        if (draggingId === null) return;
        e.preventDefault(); // habilita o drop
        e.dataTransfer.dropEffect = "move";
        if (overColumn !== columnKey) setOverColumn(columnKey);
      },
      onDragLeave: (e: DragEvent) => {
        // Só limpa o realce quando o ponteiro sai de fato da coluna (e não
        // apenas passa de um filho para outro dentro dela).
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOverColumn((c) => (c === columnKey ? null : c));
        }
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        const id = draggingId ?? e.dataTransfer.getData("text/plain");
        setDraggingId(null);
        setOverColumn(null);
        if (id) onMove(id, columnKey);
      },
    };
  }

  return { draggingId, overColumn, cardProps, columnProps };
}
