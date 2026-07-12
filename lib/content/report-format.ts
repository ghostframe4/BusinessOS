/**
 * Utilidades puras da visualização de leitura (EntityReport).
 *
 * Três responsabilidades, todas sem estado e sem React:
 * 1. Quebrar o corpo Markdown em seções + blocos (parágrafos e listas).
 * 2. Derivar KPIs dos campos por-tipo do frontmatter quando não há `report`.
 * 3. Fallbacks de exibição: extrair métricas soltas do texto e rotular fontes.
 *
 * Identificadores em inglês; conteúdo (rótulos) em pt-BR.
 */

import { EMPTY_ANSWER } from "./questionnaire";
import type { Frontmatter, ReportKpi } from "./schema";

// ---------------------------------------------------------------------------
// 1. Parser do corpo Markdown
// ---------------------------------------------------------------------------

/** Bloco de conteúdo renderizável dentro de uma seção. */
export type MdBlock =
  | { type: "p"; text: string }
  | { type: "ul"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

/** Uma seção `##` com seus blocos já separados. */
export interface ReportSectionData {
  heading: string;
  blocks: MdBlock[];
}

/**
 * Quebra o corpo por headings `##`, ignora o H1 (`# ...`) e separa o texto de
 * cada seção em blocos (parágrafos e listas `-`/`*`). Seções vazias ou apenas
 * com o placeholder `_A preencher._` são puladas — o resultado só traz seções
 * com conteúdo real, então `sections.length === 0` significa relatório vazio.
 */
export function parseReportBody(body: string): { sections: ReportSectionData[] } {
  const sections: ReportSectionData[] = [];
  let heading: string | null = null;
  let lines: string[] = [];

  const flush = (): void => {
    if (heading !== null) {
      const raw = lines.join("\n").trim();
      if (raw && raw !== EMPTY_ANSWER) {
        const blocks = parseBlocks(lines);
        if (blocks.length) sections.push({ heading, blocks });
      }
    }
    lines = [];
  };

  for (const line of (body ?? "").split(/\r?\n/)) {
    const h2 = /^##\s+(.*)$/.exec(line);
    if (h2) {
      flush();
      heading = h2[1].trim();
    } else if (/^#\s+/.test(line)) {
      // H1 (título): fecha a seção corrente e não abre nada.
      flush();
      heading = null;
    } else if (heading !== null) {
      lines.push(line);
    }
  }
  flush();

  return { sections };
}

/** Linha de tabela GFM: começa e termina com `|` (após trim). */
function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.length > 1;
}

/** Linha separadora de tabela (`|---|:--:|`): só `|`, `-`, `:` e espaço. */
function isTableDivider(line: string): boolean {
  return isTableRow(line) && /^[|\-:\s]+$/.test(line.trim()) && line.includes("-");
}

/** Quebra uma linha `| a | b |` em células, descartando as bordas vazias. */
function splitRow(line: string): string[] {
  const t = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return t.split("|").map((c) => c.trim());
}

/**
 * Um parágrafo é placeholder de template (não conteúdo) quando está inteiro em
 * itálico `_..._` e sinaliza vazio ("a preencher", "a definir", "ver perguntas").
 * Some do relatório de leitura — é nota interna, não algo que o founder escreveu.
 */
function isPlaceholderPara(text: string): boolean {
  const t = text.trim();
  if (!(t.startsWith("_") && t.endsWith("_"))) return false;
  return /(a preencher|a definir|ver perguntas|sem resposta)/i.test(t);
}

/**
 * Separa as linhas de uma seção em blocos: tabelas (GFM), listas (ordenadas e
 * não), e parágrafos. Agrupa itens/linhas contíguos e descarta placeholders de
 * template. Robusto ao Markdown real dos agentes (tabelas de priorização etc.).
 */
function parseBlocks(lines: string[]): MdBlock[] {
  const blocks: MdBlock[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let listOrdered = false;
  let table: string[] = [];

  const flushPara = (): void => {
    if (para.length) {
      const text = para.join(" ").trim();
      if (text && !isPlaceholderPara(text)) blocks.push({ type: "p", text });
      para = [];
    }
  };
  const flushList = (): void => {
    if (list.length) {
      blocks.push({ type: "ul", ordered: listOrdered, items: list.slice() });
      list = [];
    }
  };
  const flushTable = (): void => {
    if (!table.length) return;
    const rows = table.map(splitRow);
    const headers = rows[0] ?? [];
    // Descarta a linha separadora (`|---|`) se presente logo após o cabeçalho.
    const body =
      table.length > 1 && isTableDivider(table[1]) ? rows.slice(2) : rows.slice(1);
    if (headers.length) blocks.push({ type: "table", headers, rows: body });
    table = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);

    if (isTableRow(line)) {
      flushPara();
      flushList();
      table.push(line);
    } else if (ul) {
      flushPara();
      flushTable();
      if (listOrdered) flushList();
      listOrdered = false;
      list.push(ul[1].trim());
    } else if (ol) {
      flushPara();
      flushTable();
      if (!listOrdered) flushList();
      listOrdered = true;
      list.push(ol[1].trim());
    } else if (line.trim() === "") {
      flushPara();
      flushList();
      flushTable();
    } else {
      flushList();
      flushTable();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  flushTable();

  return blocks;
}

// ---------------------------------------------------------------------------
// 2. KPIs derivados dos campos por-tipo do frontmatter
// ---------------------------------------------------------------------------

/** Descritor de um campo por-tipo que vira KPI: como rotular e formatar. */
interface KpiSpec {
  key: string;
  label: string;
  kind: ReportKpi["kind"];
  format: (raw: unknown) => string | null;
}

/**
 * Campos por-tipo elegíveis a KPI, em ordem de prioridade. Metas/expectativas do
 * negócio entram como `goal` (ganham o chip "meta"); atributos e atuais como
 * `fact`. Só os presentes e não-vazios são incluídos (ver deriveKpis, máx. 4).
 */
const KPI_SPECS: KpiSpec[] = [
  { key: "north_star_metric", label: "North star", kind: "goal", format: asText },
  { key: "time_horizon", label: "Horizonte", kind: "goal", format: asText },
  { key: "target_income_month", label: "Renda-alvo", kind: "goal", format: formatIncome },
  { key: "work_hours_week", label: "Jornada", kind: "goal", format: formatHours },
  { key: "price", label: "Preço", kind: "goal", format: formatMoney },
  { key: "runway_months", label: "Runway", kind: "goal", format: formatMonths },
  { key: "market", label: "Mercado", kind: "fact", format: asText },
  { key: "maturity", label: "Maturidade", kind: "fact", format: formatMaturity },
  { key: "segment", label: "Segmento", kind: "fact", format: asText },
  { key: "persona", label: "Persona", kind: "fact", format: asText },
  { key: "hypothesis", label: "Hipótese", kind: "fact", format: asText },
  { key: "customers_count", label: "Clientes", kind: "fact", format: formatInt },
  { key: "paying_count", label: "Pagantes", kind: "fact", format: formatInt },
  { key: "net_month", label: "Resultado do mês", kind: "fact", format: formatMoney },
  { key: "conversion_rate", label: "Conversão", kind: "fact", format: formatRate },
];

/**
 * Deriva até 4 KPIs dos campos por-tipo do frontmatter. Fallback usado quando a
 * entidade não tem bloco `report`; retorna `[]` se nenhum campo estiver presente.
 */
export function deriveKpisFromFrontmatter(fm: Frontmatter): ReportKpi[] {
  const kpis: ReportKpi[] = [];
  for (const spec of KPI_SPECS) {
    if (kpis.length >= 4) break;
    const value = spec.format(fm[spec.key]);
    if (value && value.trim().length) {
      kpis.push({ label: spec.label, value: value.trim(), kind: spec.kind });
    }
  }
  return kpis;
}

// Rótulos pt-BR do enum de maturidade de mercado.
const MATURITY_LABEL: Record<string, string> = {
  emerging: "Emergente",
  growing: "Em crescimento",
  mature: "Maduro",
  declining: "Em declínio",
};

function formatMaturity(raw: unknown): string | null {
  const t = asText(raw);
  if (!t) return null;
  return MATURITY_LABEL[t.toLowerCase()] ?? t;
}

function formatIncome(raw: unknown): string | null {
  const n = asNumber(raw);
  if (n !== null) {
    // Valores em reais cheios (10000) ou já em milhares (10) caem no mesmo texto.
    const mil = n >= 1000 ? n / 1000 : n;
    return `R$ ${formatDecimal(mil)} mil/mês`;
  }
  return asText(raw);
}

function formatHours(raw: unknown): string | null {
  const n = asNumber(raw);
  if (n !== null) return `${formatDecimal(n)}h/semana`;
  return asText(raw);
}

function formatMoney(raw: unknown): string | null {
  const n = asNumber(raw);
  if (n !== null) return `R$ ${formatInt(n)}`;
  return asText(raw);
}

function formatMonths(raw: unknown): string | null {
  const n = asNumber(raw);
  if (n !== null) return `${formatDecimal(n)} ${n === 1 ? "mês" : "meses"}`;
  return asText(raw);
}

function formatRate(raw: unknown): string | null {
  const n = asNumber(raw);
  if (n !== null) {
    // Aceita fração (0,207) ou já-em-percentual (20,7).
    const pct = n <= 1 ? n * 100 : n;
    return `${formatDecimal(pct)}%`;
  }
  return asText(raw);
}

// ---------------------------------------------------------------------------
// 3. Fallbacks de exibição
// ---------------------------------------------------------------------------

// Padrões leves para pescar valores de destaque no corpo, na ordem em que
// aparecem. Cobre monetários (US$/R$) e números com unidade (%, mil, membros…).
const METRIC_PATTERNS: RegExp[] = [
  /(?:US\$|R\$|\$)\s?~?\d[\d.,]*\s?(?:bi|bilh[õo]es|mi|milh[õo]es|mil|k|m|b)?(?:\/(?:m[eê]s|ano|semana|dia))?/giu,
  /~?\d[\d.,]*\s?(?:%|bi|bilh[õo]es|milh[õo]es|mil|membros|clientes|assinantes|criadores|meses|anos|h\/(?:dia|semana))/giu,
];

/** Substantivos de unidade que viram rótulo do KPI (separados do valor). */
const NOUN_RE =
  /\s+(membros|clientes|assinantes|criadores|usu[aá]rios|pessoas|alunos|meses|anos)\b/i;

/** "Membros" a partir de "membros" — primeira letra maiúscula, resto igual. */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Pesca até 3 valores de destaque do texto (monetários e números com unidade),
 * deduplicados e em ordem de aparição. Quando o valor traz um substantivo
 * conhecido ("100.000 membros"), separa em valor + rótulo. Fallback visual
 * quando não há `report` nem campos por-tipo.
 */
export function extractMetricsFromText(
  text: string,
): { value: string; label?: string }[] {
  if (!text) return [];

  const found: { value: string; at: number }[] = [];
  for (const re of METRIC_PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const value = m[0].trim().replace(/\s+/g, " ");
      if (value) found.push({ value, at: m.index });
      if (m.index === re.lastIndex) re.lastIndex++; // guarda contra match vazio
    }
  }
  found.sort((a, b) => a.at - b.at);

  const seen = new Set<string>();
  const out: { value: string; label?: string }[] = [];
  for (const f of found) {
    const key = f.value.toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);
    const noun = NOUN_RE.exec(f.value);
    if (noun) {
      out.push({ value: f.value.replace(NOUN_RE, "").trim(), label: capitalize(noun[1]) });
    } else {
      out.push({ value: f.value });
    }
    if (out.length >= 3) break;
  }
  return out;
}

/** Rótulo curto do host de uma URL (ex.: "https://www.imarc.com/x" -> "imarc.com"). */
export function formatSourceHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return (
      url
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0] || url
    );
  }
}

// ---------------------------------------------------------------------------
// Coerções internas
// ---------------------------------------------------------------------------

/** Texto não-vazio de um valor desconhecido, ou null. */
function asText(raw: unknown): string | null {
  if (typeof raw === "string") {
    const t = raw.trim();
    return t.length ? t : null;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return null;
}

/** Número a partir de number ou string em formato pt-BR ("10.000", "20,7"), ou null. */
function asNumber(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string") {
    const cleaned = raw.trim().replace(/[^\d.,-]/g, "");
    if (!cleaned) return null;
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatInt(n: number | unknown): string | null {
  const value = typeof n === "number" ? n : asNumber(n);
  if (value === null) return asText(n);
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function formatDecimal(n: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n);
}
