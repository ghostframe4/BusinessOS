"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { GenerateBriefing } from "@/components/entities/generate-briefing";
import { StatusBadge } from "@/components/entities/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ENTITY_AGENT } from "@/lib/content/agent-map";
import { STATUS_LABEL } from "@/lib/content/labels";
import {
  parseAnswers,
  questionnaireFor,
  renderAnswersBody,
} from "@/lib/content/questionnaire";
import type { EntityDoc, Status } from "@/lib/content/schema";
import { cn } from "@/lib/utils";
// A action é criada pela rota (docs/04 §7.1). Contrato: saveEntity(input) => SaveResult.
import { saveEntity } from "@/app/(app)/[section]/[entity]/actions";

/** Resultado de `saveEntity` (docs/04 §7.1) — definido local ao form. */
export type SaveResult =
  | { ok: true; revision: number; updated: string }
  | {
      ok: false;
      kind: "conflict" | "validation" | "policy" | "unknown";
      message: string;
      fieldErrors?: Record<string, string>;
    };

/** Ordem de exibição dos status no seletor. */
const STATUS_OPTIONS: Status[] = [
  "empty",
  "draft",
  "in_progress",
  "needs_review",
  "validated",
  "archived",
];

export interface EntityFormProps {
  doc: EntityDoc;
  className?: string;
}

/** "a, b, c" -> ["a", "b", "c"] (descarta vazios). */
function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Form de edição de uma EntityDoc (docs/03 §9.3 e docs/04 §7.1).
 *
 * O corpo Markdown é editado como um QUESTIONÁRIO guiado: uma pergunta por seção
 * `##` do template (ver `questionnaire.ts`). As respostas ficam em estado
 * controlado e são remontadas no corpo (`renderAnswersBody`) num input oculto que
 * a action envia. Ao terminar, o founder gera um briefing por IA a partir das
 * respostas atuais (`GenerateBriefing`). Erros vêm inline; sucesso dispara toast.
 */
export function EntityForm({ doc, className }: EntityFormProps) {
  const router = useRouter();
  const fm = doc.frontmatter;

  const questions = useMemo(() => questionnaireFor(fm.id), [fm.id]);
  const agentSlug = ENTITY_AGENT[fm.id] ?? null;

  const [status, setStatus] = useState<Status>(fm.status);
  const [title, setTitle] = useState<string>(fm.title);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    parseAnswers(doc.body, questions),
  );

  // baseRevision em ref: evita conflito otimista falso após um save sem reload.
  const baseRevisionRef = useRef<number>(fm.revision);

  // Corpo remontado a partir das respostas — enviado via input oculto `body`.
  const body = renderAnswersBody(title, questions, answers);

  const [state, formAction, isPending] = useActionState<SaveResult | null, FormData>(
    async (_prev, formData) => {
      const frontmatterPatch: Record<string, unknown> = {
        title: String(formData.get("title") ?? "").trim(),
        status: String(formData.get("status") ?? fm.status),
        summary: String(formData.get("summary") ?? "").trim(),
        owner: String(formData.get("owner") ?? "").trim(),
        tags: parseTags(String(formData.get("tags") ?? "")),
        order: Number.parseInt(String(formData.get("order") ?? "0"), 10) || 0,
      };
      return saveEntity({
        id: fm.id,
        baseRevision: baseRevisionRef.current,
        frontmatterPatch,
        body: String(formData.get("body") ?? ""),
      });
    },
    null,
  );

  // Sincroniza a revisão base quando o doc é revalidado no servidor.
  useEffect(() => {
    baseRevisionRef.current = fm.revision;
  }, [fm.revision]);

  // Reage ao resultado de cada submit.
  useEffect(() => {
    if (state && state.ok) {
      baseRevisionRef.current = state.revision;
      toast.success("Alterações salvas");
    }
  }, [state]);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const topError = state && !state.ok ? state.message : undefined;

  function fieldError(name: string): string | undefined {
    return fieldErrors?.[name];
  }

  function setAnswer(heading: string, value: string): void {
    setAnswers((prev) => ({ ...prev, [heading]: value }));
  }

  return (
    <form action={formAction} className={cn("flex flex-col gap-6", className)}>
      {/* Corpo remontado das respostas; fonte de verdade do Markdown enviado. */}
      <input type="hidden" name="body" value={body} />

      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Editar {title}</h2>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono">{fm.id}</span>
          <span aria-hidden>·</span>
          <span>revisão {fm.revision}</span>
          <span aria-hidden>·</span>
          <StatusBadge status={status} />
        </p>
      </header>

      {topError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {topError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          aria-invalid={fieldError("title") ? true : undefined}
          className={cn(fieldError("title") && "border-destructive")}
        />
        {fieldError("title") && (
          <p className="text-sm text-destructive">{fieldError("title")}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="status-trigger">Status</Label>
        <Select
          name="status"
          value={status}
          onValueChange={(value) => setStatus(value as Status)}
        >
          <SelectTrigger
            id="status-trigger"
            aria-invalid={fieldError("status") ? true : undefined}
            className={cn(fieldError("status") && "border-destructive")}
          >
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {STATUS_LABEL[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError("status") && (
          <p className="text-sm text-destructive">{fieldError("status")}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="summary">Resumo</Label>
        <Input
          id="summary"
          name="summary"
          defaultValue={fm.summary}
          aria-invalid={fieldError("summary") ? true : undefined}
          className={cn(fieldError("summary") && "border-destructive")}
        />
        <p className="text-xs text-muted-foreground">
          Frase curta que aparece no card. A IA pode preencher isto ao gerar o briefing.
        </p>
        {fieldError("summary") && (
          <p className="text-sm text-destructive">{fieldError("summary")}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            name="tags"
            defaultValue={fm.tags.join(", ")}
            aria-invalid={fieldError("tags") ? true : undefined}
            className={cn(fieldError("tags") && "border-destructive")}
          />
          <p className="text-xs text-muted-foreground">Separe por vírgula.</p>
          {fieldError("tags") && (
            <p className="text-sm text-destructive">{fieldError("tags")}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="order">Ordem</Label>
          <Input
            id="order"
            name="order"
            type="number"
            min={0}
            step={1}
            defaultValue={fm.order}
            aria-invalid={fieldError("order") ? true : undefined}
            className={cn(fieldError("order") && "border-destructive")}
          />
          {fieldError("order") && (
            <p className="text-sm text-destructive">{fieldError("order")}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="owner">Responsável</Label>
        <Input
          id="owner"
          name="owner"
          type="email"
          defaultValue={fm.owner}
          aria-invalid={fieldError("owner") ? true : undefined}
          className={cn(fieldError("owner") && "border-destructive")}
        />
        {fieldError("owner") && (
          <p className="text-sm text-destructive">{fieldError("owner")}</p>
        )}
      </div>

      {questions.length > 0 && (
        <section className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold tracking-tight">Questionário</h3>
            <p className="text-sm text-muted-foreground">
              Responda o que souber — pode deixar em branco. Ao terminar, gere um
              briefing com IA a partir das suas respostas.
            </p>
          </div>

          {questions.map((q, index) => {
            const fieldId = `q-${index}`;
            return (
              <div key={q.heading} className="flex flex-col gap-2">
                <Label htmlFor={fieldId} className="text-sm font-medium">
                  {q.label}
                </Label>
                <Textarea
                  id={fieldId}
                  value={answers[q.heading] ?? ""}
                  onChange={(e) => setAnswer(q.heading, e.target.value)}
                  placeholder={q.placeholder}
                  className="min-h-24"
                />
                {q.hint && (
                  <p className="text-xs text-muted-foreground">{q.hint}</p>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              Terminou? Deixe a IA sintetizar um briefing.
            </p>
            <GenerateBriefing
              id={fm.id}
              title={title}
              questions={questions}
              answers={answers}
              agentSlug={agentSlug}
            />
          </div>
        </section>
      )}

      <footer className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </footer>
    </form>
  );
}
