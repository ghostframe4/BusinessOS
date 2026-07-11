"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Question } from "@/lib/content/questionnaire";
import { cn } from "@/lib/utils";

export interface GenerateBriefingProps {
  id: string;
  title: string;
  questions: Question[];
  /** Respostas atuais do formulário (heading -> texto), estado vivo. */
  answers: Record<string, string>;
  /** Slug do agente responsável, ou `null` se a entidade é `founder_only`. */
  agentSlug: string | null;
  className?: string;
}

/** Monta o bloco "## heading\nresposta" com as respostas atuais. */
function renderAnswerBlock(questions: Question[], answers: Record<string, string>): string {
  return questions
    .map((q) => {
      const answer = (answers[q.heading] ?? "").trim();
      return `## ${q.heading}\n${answer.length > 0 ? answer : "(sem resposta)"}`;
    })
    .join("\n\n");
}

/**
 * Prompt para o Claude Code sintetizar o briefing a partir das respostas.
 * `propose`: instrui o subagente a escrever via CLIs (entra como needs_review).
 * `founder_only`: pede só a análise/texto de volta (sem `agent:write`).
 */
function buildBriefingPrompt(
  id: string,
  title: string,
  questions: Question[],
  answers: Record<string, string>,
  agentSlug: string | null,
): string {
  const block = renderAnswerBlock(questions, answers);

  if (agentSlug === null) {
    return (
      `Analise as minhas respostas abaixo sobre "${title}" (id ${id}) e escreva um ` +
      `briefing claro e sintético que eu possa colar. Esta entidade é founder_only — ` +
      `NÃO use agent:write; apenas me devolva o texto: um resumo de 1–2 frases seguido ` +
      `do corpo organizado pelas seções abaixo, preenchendo o que estiver vago.\n\n` +
      `Minhas respostas:\n\n${block}`
    );
  }

  return (
    `Use o subagente @${agentSlug} para gerar o briefing de "${title}" (id ${id}) ` +
    `a partir das minhas respostas abaixo.\n\n` +
    `Tarefa: analise as respostas, sintetize um briefing claro e proponha a versão ` +
    `final via os CLIs — leia o contexto com \`pnpm agent:read --id ${id}\` (pegue a ` +
    `revisão base), e escreva com \`pnpm agent:write --id ${id} --editor agent:${agentSlug} ` +
    `--base-revision <n>\`. Mantenha os headings do template, escreva um \`--summary\` ` +
    `de 1–2 frases e deixe como needs_review para eu aprovar.\n\n` +
    `Minhas respostas:\n\n${block}`
  );
}

/**
 * Botão "Gerar briefing com IA": pega as respostas atuais do questionário e
 * monta o comando pronto para o founder colar no Claude Code (padrão sem chave
 * de API — a IA "local" é o próprio Claude Code rodando no repo). Nada é
 * publicado sem revisão do founder.
 */
export function GenerateBriefing({
  id,
  title,
  questions,
  answers,
  agentSlug,
  className,
}: GenerateBriefingProps) {
  const [copied, setCopied] = useState(false);

  const answered = questions.filter(
    (q) => (answers[q.heading] ?? "").trim().length > 0,
  ).length;
  const prompt = buildBriefingPrompt(id, title, questions, answers, agentSlug);

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success("Prompt copiado — cole no Claude Code");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o prompt.");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={className}>
          <Sparkles aria-hidden />
          Gerar briefing com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar briefing com IA</DialogTitle>
          <DialogDescription>
            A IA lê as suas respostas e sintetiza um briefing. Copie o prompt
            abaixo e cole no Claude Code — nada é publicado sem a sua revisão.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {answered} de {questions.length} perguntas respondidas.
          {answered < questions.length && " Você pode gerar mesmo assim — o vago vira "}
          {answered < questions.length && <span className="italic">a preencher</span>}
          {answered < questions.length && "."}
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2 rounded-md border bg-muted p-3">
            <code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-xs">
              {prompt}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={handleCopy}
              aria-label="Copiar prompt"
            >
              {copied ? (
                <Check className="size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
