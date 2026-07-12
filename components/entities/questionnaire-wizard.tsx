"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Question } from "@/lib/content/questionnaire";
import { cn } from "@/lib/utils";

export interface QuestionnaireWizardProps {
  /** Título da entidade — mostrado como contexto no topo do wizard. */
  entityTitle: string;
  questions: Question[];
  /** Respostas atuais (heading -> texto), estado vivo do form pai. */
  answers: Record<string, string>;
  onAnswer: (heading: string, value: string) => void;
  /** Concluiu a última pergunta — pai troca para o modo de revisão. */
  onFinish: () => void;
  /** Escape: pular o guiado e editar tudo de uma vez. */
  onEditAll: () => void;
  className?: string;
}

/**
 * Fluxo de onboarding do questionário: uma pergunta por vez, com barra de
 * progresso e navegação Voltar/Próxima. As respostas escrevem direto no estado
 * do form pai (nada é salvo aqui). Na última pergunta, "Revisar respostas"
 * chama `onFinish` e o pai mostra a página completa e editável.
 */
export function QuestionnaireWizard({
  entityTitle,
  questions,
  answers,
  onAnswer,
  onFinish,
  onEditAll,
  className,
}: QuestionnaireWizardProps) {
  const [step, setStep] = useState(0);

  const total = questions.length;
  const question = questions[step];
  const isFirst = step === 0;
  const isLast = step === total - 1;
  const answeredCount = questions.filter(
    (q) => (answers[q.heading] ?? "").trim().length > 0,
  ).length;
  const progress = Math.round(((step + 1) / total) * 100);
  const currentFilled = (answers[question.heading] ?? "").trim().length > 0;

  function goNext(): void {
    if (isLast) onFinish();
    else setStep((s) => Math.min(s + 1, total - 1));
  }

  function goBack(): void {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      goNext();
    }
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-7 rounded-3xl bg-card p-6 shadow-sm sm:p-8",
        className,
      )}
    >
      {/* Progresso */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="uppercase tracking-wide">
            {entityTitle} · pergunta {step + 1} de {total}
          </span>
          <span>{answeredCount} respondida{answeredCount === 1 ? "" : "s"}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Pergunta atual (troca com leve animação) — duas colunas no desktop
          para ocupar a largura: enunciado à esquerda, resposta ampla à direita. */}
      <div
        key={step}
        className="grid gap-8 duration-300 animate-in fade-in slide-in-from-right-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-12"
      >
        <div className="flex flex-col gap-3">
          <h3 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
            {question.label}
          </h3>
          {question.hint && (
            <p className="text-base text-muted-foreground">{question.hint}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Textarea
            // Remonta o campo a cada passo para focar/limpar a rolagem.
            autoFocus
            value={answers[question.heading] ?? ""}
            onChange={(e) => onAnswer(question.heading, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={question.placeholder}
            className="min-h-52 text-base lg:min-h-64"
          />
          <p className="text-xs text-muted-foreground">
            Dica: <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">⌘/Ctrl + Enter</kbd> para avançar.
          </p>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={goBack}
          disabled={isFirst}
        >
          <ArrowLeft aria-hidden />
          Voltar
        </Button>

        {isLast ? (
          <Button type="button" variant="brand" onClick={goNext}>
            <Check aria-hidden />
            Revisar respostas
          </Button>
        ) : (
          <Button
            type="button"
            variant={currentFilled ? "brand" : "ghost"}
            onClick={goNext}
          >
            {currentFilled ? "Próxima" : "Pular"}
            <ArrowRight aria-hidden />
          </Button>
        )}
      </div>

      {/* Escape para o modo completo */}
      <button
        type="button"
        onClick={onEditAll}
        className="inline-flex items-center gap-1.5 self-center rounded-full text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ListChecks className="size-3.5" aria-hidden />
        Preencher tudo de uma vez
      </button>
    </section>
  );
}
