import { Fragment } from "react";

import type { MdBlock } from "@/lib/content/report-format";
import { cn } from "@/lib/utils";

export interface ReportSectionProps {
  heading: string;
  blocks: MdBlock[];
}

/**
 * Uma seção `##` do corpo renderizada como CARD: heading forte e, dentro,
 * parágrafos, listas (ordenadas ou não) e tabelas — cada informação num
 * container claro, nunca texto solto no canvas. Markdown inline (`**negrito**`,
 * `*itálico*`, `_itálico_`, `` `código` ``) é renderizado por `renderInline`.
 */
export function ReportSection({ heading, blocks }: ReportSectionProps) {
  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
        {heading}
      </h2>
      <div className="flex flex-col gap-5">
        {blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    </section>
  );
}

/** Despacha um bloco para o renderizador certo (parágrafo, lista ou tabela). */
function BlockView({ block }: { block: MdBlock }) {
  if (block.type === "p") {
    return (
      <p className="text-base leading-relaxed text-foreground/90">
        {renderInline(block.text)}
      </p>
    );
  }

  if (block.type === "table") {
    return <TableView headers={block.headers} rows={block.rows} />;
  }

  const ListTag = block.ordered ? "ol" : "ul";
  return (
    <ListTag className="flex flex-col gap-2.5">
      {block.items.map((item, j) => (
        <li
          key={j}
          className="flex gap-3 text-base leading-relaxed text-foreground/90"
        >
          {block.ordered ? (
            <span className="tabular mt-px shrink-0 text-sm font-semibold text-muted-foreground">
              {j + 1}.
            </span>
          ) : (
            <span
              className="mt-2.5 size-1.5 shrink-0 rounded-full bg-lavender"
              aria-hidden
            />
          )}
          <span>{renderInline(item)}</span>
        </li>
      ))}
    </ListTag>
  );
}

/** Tabela GFM renderizada com rolagem horizontal em telas estreitas. */
function TableView({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 font-semibold text-muted-foreground"
              >
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr
              key={r}
              className={cn(
                "border-b border-border/60",
                r % 2 === 1 && "bg-muted/40",
              )}
            >
              {row.map((cell, c) => (
                <td
                  key={c}
                  className="px-3 py-2 align-top text-foreground/90"
                >
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renderiza Markdown inline sem libs: `**negrito**`, `*itálico*`/`_itálico_` e
 * `` `código` ``. Quebra o texto pelos delimitadores e mapeia cada trecho ao
 * elemento correto, preservando o texto entre eles.
 */
function renderInline(text: string): React.ReactNode[] {
  // Um só split cobrindo os quatro delimitadores; captura o trecho com marcador.
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g);
  return parts.map((part, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {bold[1]}
        </strong>
      );
    }
    const italic = /^\*([^*]+)\*$/.exec(part) ?? /^_([^_]+)_$/.exec(part);
    if (italic) {
      return (
        <em key={i} className="italic">
          {italic[1]}
        </em>
      );
    }
    const code = /^`([^`]+)`$/.exec(part);
    if (code) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {code[1]}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
