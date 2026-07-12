"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  FileText,
  ImageIcon,
  Paperclip,
  Plus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CHAT_MODELS,
  chatModelLabel,
  DEFAULT_CHAT_MODEL_ID,
} from "@/lib/ai/chat-models";
import { cn } from "@/lib/utils";

/** Altura máxima do textarea antes de virar rolagem interna. */
const MAX_HEIGHT = 200;

/** Anexo local (só visualização): imagem ganha thumbnail via object URL. */
interface Attachment {
  id: string;
  name: string;
  kind: "image" | "file";
  previewUrl?: string;
}

export interface ChatComposerProps {
  /** Dispara o envio com o texto atual (já validado como não-vazio). */
  onSend: (text: string) => void;
  /** Enquanto a IA responde, bloqueia novos envios. */
  busy?: boolean;
  /** Cabo solto: sem chave de IA, o composer fica desabilitado. */
  disabled?: boolean;
  /** Modelo selecionado (id da allowlist de `chat-models`). */
  model?: string;
  /** Notifica a troca de modelo no seletor. */
  onModelChange?: (id: string) => void;
  className?: string;
  autoFocus?: boolean;
}

/**
 * Composer do chat (SPEC — página Principal): textarea em pill que cresce com o
 * conteúdo (até {@link MAX_HEIGHT}px) e botão de enviar à direita. Enter envia;
 * Shift+Enter quebra linha. Herdada do `Textarea` do design "Flux".
 *
 * À esquerda, um botão "more" abre um dropdown para subir arquivos ou imagens.
 * Os anexos aparecem como cards quadrados com um X para remover — por ora são
 * apenas VISUAIS (ainda não há upload/persistência; ver storage no ADR 0001),
 * então são descartados ao enviar. Antes do botão de enviar, um seletor troca o
 * modelo de IA usado.
 */
export function ChatComposer({
  onSend,
  busy = false,
  disabled = false,
  model = DEFAULT_CHAT_MODEL_ID,
  onModelChange,
  className,
  autoFocus = false,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const idSeq = useRef(0);
  // Espelha os anexos atuais para o cleanup de desmontagem revogar os URLs certos.
  const attachmentsRef = useRef<Attachment[]>([]);
  attachmentsRef.current = attachments;

  const inert = disabled;
  const canSend = value.trim().length > 0 && !busy && !inert;
  const anyMenuOpen = attachMenuOpen || modelMenuOpen;

  // Fecha os dropdowns ao clicar fora ou apertar Escape.
  useEffect(() => {
    if (!anyMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (attachMenuRef.current && !attachMenuRef.current.contains(t)) {
        setAttachMenuOpen(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(t)) {
        setModelMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAttachMenuOpen(false);
        setModelMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anyMenuOpen]);

  // Libera os object URLs das imagens ao desmontar (evita vazamento).
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach(
        (a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl),
      );
    };
  }, []);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }

  function addFiles(files: FileList | null, kind: "image" | "file") {
    if (!files || files.length === 0) return;
    const next = Array.from(files).map((file) => {
      const isImage = kind === "image" || file.type.startsWith("image/");
      return {
        id: `att-${idSeq.current++}`,
        name: file.name,
        kind: isImage ? ("image" as const) : ("file" as const),
        previewUrl: isImage ? URL.createObjectURL(file) : undefined,
      };
    });
    setAttachments((prev) => [...prev, ...next]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }

  function submit() {
    if (!canSend) return;
    onSend(value.trim());
    setValue("");
    // Anexos são só visuais por enquanto: descarta e libera os thumbnails.
    attachments.forEach((a) => a.previewUrl && URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    // Recolhe o textarea ao mínimo após enviar.
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
    }
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-input bg-muted p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring",
        inert && "opacity-60",
        className,
      )}
    >
      {/* Inputs de arquivo ocultos, disparados pelos itens do dropdown. */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files, "image");
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files, "file");
          e.target.value = "";
        }}
      />

      {/* Cards de visualização dos anexos. */}
      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2 px-1 pb-2 pt-1">
          {attachments.map((att) => (
            <li key={att.id} className="relative">
              <div
                title={att.name}
                className="flex size-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-card"
              >
                {att.kind === "image" && att.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.previewUrl}
                    alt={att.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 px-1 text-muted-foreground">
                    <FileText className="size-5" aria-hidden />
                    <span className="w-full truncate text-center text-[10px] leading-none">
                      {att.name}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label={`Remover ${att.name}`}
                onClick={() => removeAttachment(att.id)}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-colors hover:bg-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        {/* Botão "more": dropdown para subir arquivos/imagens. */}
        <div ref={attachMenuRef} className="relative shrink-0">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Adicionar anexo"
            aria-haspopup="menu"
            aria-expanded={attachMenuOpen}
            disabled={inert}
            onClick={() => {
              setModelMenuOpen(false);
              setAttachMenuOpen((o) => !o);
            }}
            className="text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <Plus className="size-6" aria-hidden />
          </Button>

          {attachMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-full left-0 z-20 mb-2 w-48 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAttachMenuOpen(false);
                  imageInputRef.current?.click();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
              >
                <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
                Subir imagens
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAttachMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
              >
                <Paperclip className="size-4 text-muted-foreground" aria-hidden />
                Subir arquivos
              </button>
            </div>
          )}
        </div>

        <Textarea
          ref={ref}
          value={value}
          rows={1}
          autoFocus={autoFocus}
          disabled={inert}
          placeholder="Pergunte ao BusinessOS"
          onChange={(e) => setValue(e.target.value)}
          onInput={(e) => autoGrow(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-[15px] shadow-none focus-visible:ring-0"
        />

        {/* Seletor de modelo. */}
        <div ref={modelMenuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label="Escolher modelo"
            aria-haspopup="menu"
            aria-expanded={modelMenuOpen}
            disabled={inert}
            onClick={() => {
              setAttachMenuOpen(false);
              setModelMenuOpen((o) => !o);
            }}
            className="flex h-10 items-center gap-1 rounded-full px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <span className="max-w-[9rem] truncate">{chatModelLabel(model)}</span>
            <ChevronDown className="size-3.5" aria-hidden />
          </button>

          {modelMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-full right-0 z-20 mb-2 w-56 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg"
            >
              {CHAT_MODELS.map((m) => {
                const active = m.id === model;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setModelMenuOpen(false);
                      onModelChange?.(m.id);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0 text-foreground",
                        !active && "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-foreground">
                        {m.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {m.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          type="button"
          size="icon"
          variant="brand"
          aria-label="Enviar mensagem"
          disabled={!canSend}
          onClick={submit}
          className="shrink-0"
        >
          <ArrowUp className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
