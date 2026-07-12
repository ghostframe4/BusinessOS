"use client";

import type * as React from "react";
import { useState } from "react";
import { BarChart3, Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";

import { AiUnavailableButton } from "@/components/entities/ai-unavailable-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { requestAiFill } from "@/lib/ai/fill-client";

export interface GenerateReportProps {
  id: string;
  title: string;
  /** Slug do agente responsável, ou `null` se a entidade é `founder_only`. */
  agentSlug: string | null;
  /** IA ligada no runtime? (cabo solto: presença da ANTHROPIC_API_KEY). */
  aiEnabled?: boolean;
}

/**
 * Prompt para o Claude Code montar o bloco `report` (KPIs + insights) da
 * entidade a partir de PESQUISA WEB com fontes reais e verificáveis.
 * `propose`: instrui a escrever só o campo `report` via CLIs (needs_review).
 * `founder_only`: a política bloqueia `agent:write` — pede o texto de volta.
 */
function buildReportPrompt(id: string, title: string, agentSlug: string | null): string {
  const shape =
    `{"generated_at":"AAAA-MM-DD","generated_by":"report-builder",` +
    `"kpis":[{"label":"...","value":"...","kind":"fact","source":"https://fonte-real...","source_label":"..."},` +
    `{"label":"...","value":"...","kind":"goal"}],` +
    `"insights":[{"text":"...","source":"https://fonte-real...","source_label":"..."}]}`;

  if (agentSlug === null) {
    return (
      `Pesquise dados de mercado REAIS e atuais para a entidade "${title}" (id ${id}) e ` +
      `monte um relatório para eu revisar.\n\n` +
      `Passos:\n` +
      `1. Leia o contexto com \`pnpm agent:read --id ${id}\` para entender o alvo.\n` +
      `2. PESQUISE na web dados relevantes a esta entidade, usando apenas FONTES ` +
      `CONFIÁVEIS (relatórios de institutos, dados de indústria, órgãos oficiais). ` +
      `Cada número precisa de uma URL real e verificável.\n` +
      `3. Monte um bloco \`report\` com \`kpis\` (cada um: label, value formatado, ` +
      `\`kind:"fact"\` COM \`source\` = URL real + \`source_label\`; ou \`kind:"goal"\` ` +
      `para metas/expectativas do próprio negócio, sem exigir fonte) e \`insights\` ` +
      `(frases-conclusão curtas, com \`source\` quando ancoradas em dado externo).\n\n` +
      `Esta entidade é founder_only — NÃO use \`agent:write\` (a política bloqueia a ` +
      `escrita de agente). Apenas me devolva o \`report\` em texto (JSON) para eu colar ` +
      `ou editar manualmente.`
    );
  }

  return (
    `Pesquise dados de mercado REAIS e atuais para a entidade "${title}" (id ${id}) e ` +
    `proponha um relatório para minha aprovação.\n\n` +
    `Passos:\n` +
    `1. Leia o contexto com \`pnpm agent:read --id ${id}\` e pegue a revisão base ` +
    `(\`frontmatter.revision\`).\n` +
    `2. PESQUISE na web dados relevantes a esta entidade, usando apenas FONTES ` +
    `CONFIÁVEIS (relatórios de institutos, dados de indústria, órgãos oficiais). ` +
    `Cada número precisa de uma URL real e verificável.\n` +
    `3. Monte um bloco \`report\` com \`kpis\` (cada um: label CURTO, value CURTO e ` +
    `formatado — ex.: "US$ 4,2 bi" — com o contexto na \`note\`; \`kind:"fact"\` COM ` +
    `\`source\` = URL real + \`source_label\`; ou \`kind:"goal"\` para metas/expectativas ` +
    `do próprio negócio, sem exigir fonte) e \`insights\` (frases-conclusão curtas, ` +
    `com \`source\` quando ancoradas em dado externo). Formato: \`${shape}\`\n` +
    `4. Grave SOMENTE o campo report (sem tocar no corpo). No Windows o \`pnpm\` ` +
    `reencaminha via cmd.exe e corrompe JSON grande — escreva o JSON num arquivo ` +
    `temporário e chame o CLI direto pelo Git Bash:\n` +
    `\`node_modules/.bin/tsx scripts/agent-write.ts --id ${id} --editor agent:report-builder ` +
    `--base-revision <n> --set "report=$(cat /tmp/report.json)"\`\n` +
    `5. Deixe como needs_review para eu aprovar na barra de proposta.`
  );
}

/**
 * Botão "Gerar relatório com IA".
 *  - `aiEnabled` (e não `founder_only`): a IA pesquisa na web e propõe o bloco
 *    `report` no runtime (chama a API, que grava como `needs_review`). O prompt
 *    para o Claude Code fica como alternativa.
 *  - `!aiEnabled` (e não `founder_only`): botão desabilitado + tooltip.
 *  - `founder_only`: a política bloqueia a escrita de agente — mantém apenas o
 *    prompt para o founder colar/editar à mão.
 */
export function GenerateReport({
  id,
  title,
  agentSlug,
  aiEnabled = true,
}: GenerateReportProps): React.JSX.Element {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);

  // Runtime só faz sentido em entidades escrevíveis por agente (propose).
  const canRuntime = agentSlug !== null;
  const prompt = buildReportPrompt(id, title, agentSlug);

  if (canRuntime && !aiEnabled) {
    return (
      <AiUnavailableButton variant="brand">
        <BarChart3 className="size-4" aria-hidden />
        Gerar relatório
      </AiUnavailableButton>
    );
  }

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

  async function handleGenerate(): Promise<void> {
    setRunning(true);
    try {
      const result = await requestAiFill({ id, mode: "report" });
      if (result.ok) {
        toast.success("Relatório proposto — revise e aprove na barra de proposta.");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="brand">
          <BarChart3 className="size-4" aria-hidden />
          Gerar relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar relatório com IA</DialogTitle>
          <DialogDescription>
            A IA pesquisa dados reais na web com fontes confiáveis e propõe o
            relatório para a sua aprovação. Nada é publicado sem a sua revisão.
          </DialogDescription>
        </DialogHeader>

        {canRuntime && (
          <Button
            type="button"
            variant="brand"
            onClick={handleGenerate}
            disabled={running}
          >
            {running ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Pesquisando e gerando...
              </>
            ) : (
              <>
                <BarChart3 className="size-4" aria-hidden />
                Gerar relatório com IA
              </>
            )}
          </Button>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">
            {canRuntime
              ? "Ou copie o prompt para rodar no Claude Code"
              : "Esta entidade é founder_only — copie o prompt e traga o resultado de volta"}
          </p>
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
