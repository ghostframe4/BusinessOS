"use client";

import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { UIMessage } from "ai";
import Markdown from "react-markdown";

import { cn } from "@/lib/utils";

export interface MessageListProps {
  messages: UIMessage[];
  /** True enquanto a última resposta do assistant ainda está sendo transmitida. */
  streaming?: boolean;
}

/** Junta as partes de texto de uma UIMessage num único markdown. */
function textOf(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

/** Mapeia elementos do markdown para os tokens do design (sem plugin typography). */
const markdownComponents = {
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mb-3 last:mb-0" {...props} />
  ),
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="mb-3 mt-4 text-xl font-semibold first:mt-0" {...props} />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mb-2 mt-4 text-lg font-semibold first:mt-0" {...props} />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mb-2 mt-3 text-base font-semibold first:mt-0" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mb-3 list-disc space-y-1 pl-5" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mb-3 list-decimal space-y-1 pl-5" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a
      className="font-medium text-brand underline underline-offset-2 hover:opacity-80"
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold" {...props} />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="mb-3 border-l-2 border-border pl-4 text-muted-foreground"
      {...props}
    />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code
      className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
      {...props}
    />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="mb-3 overflow-x-auto rounded-2xl bg-muted p-4 text-sm"
      {...props}
    />
  ),
};

/**
 * Lista de mensagens do chat (SPEC — página Principal). Bolha do usuário à
 * direita em `bg-muted`; resposta do assistant sem bolha, em largura de leitura
 * (`max-w-3xl`), com markdown. Rola sozinha para o fim ao chegar tokens.
 */
export function MessageList({ messages, streaming = false }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  const last = messages[messages.length - 1];
  const showTyping =
    streaming && (!last || last.role !== "assistant" || textOf(last).length === 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {messages.map((message) =>
        message.role === "user" ? (
          <div key={message.id} className="flex justify-end">
            <div className="max-w-[80%] whitespace-pre-wrap rounded-3xl bg-muted px-4 py-2.5 text-[15px] leading-relaxed">
              {textOf(message)}
            </div>
          </div>
        ) : (
          <div
            key={message.id}
            className={cn(
              "text-[15px] leading-relaxed text-foreground",
              "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
            )}
          >
            <Markdown components={markdownComponents}>{textOf(message)}</Markdown>
          </div>
        ),
      )}

      {showTyping && (
        <div className="flex items-center gap-1.5 text-muted-foreground" aria-live="polite">
          <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.2s]" />
          <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.1s]" />
          <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60" />
          <span className="sr-only">Gerando resposta…</span>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
