---
doc: design-system
title: Design System do BusinessOS
status: derivado
deriva_de: 00-briefing
versao: 1.0.0
owner: ruanbraz@overlens.com.br
atualizado_em: 2026-07-11
tags: [design-system, tokens, tailwind, shadcn, inter, sidebar, cards, acessibilidade]
---

# BusinessOS — Design System

> **Documento derivado.** Baseado em `docs/00-briefing.md` (fonte canonica). Em conflito, o briefing prevalece. Aqui detalhamos a camada visual: principios, tokens prontos para Tailwind/shadcn, e specs de componentes (sidebar, cards, view-toggle, estados). Todos os valores sao **drop-in**: copie para `globals.css` e `tailwind.config.ts`.

---

## 1. Principios de Design

O BusinessOS e um sistema operacional de decisao. A UI deve **sumir** e deixar o conteudo do negocio (os MD) em primeiro plano.

1. **Minimalista preto & branco.** Zero cor decorativa. A hierarquia vem de **peso tipografico, espaco e uma escala de cinzas** — nunca de matiz. Cor e reservada apenas para o token `destructive` (erro), usado com parcimonia.
2. **Preto quase-preto, branco puro.** O "preto" e `#0A0A0A` (neutral-950), nao `#000000` — reduz vibracao em telas e suaviza o contraste sem perder legibilidade AAA.
3. **Estrutura por borda, nao por sombra.** Superficies se separam por `border` de 1px em cinza claro. Sombras existem, mas sao sutis e reservadas a estados elevados (hover de card, popover, dialog).
4. **Cantos arredondados e amigaveis.** Raio base generoso (`0.75rem`), coerente em toda a UI. Nada de quinas retas; nada de pilulas exageradas fora de badges.
5. **Densidade calma.** Espaco em branco abundante. Alvos de toque >= 40px. Ritmo vertical previsivel (escala de 4px).
6. **Um sistema, componentizado.** Cada primitivo vive no Storybook, tematizado por **CSS variables** — trocar o tema nunca exige editar componente.
7. **Legivel humano + maquina.** O visual espelha o modelo MD: cada **card = 1 entidade = 1 arquivo**. A UI e um editor de arquivos, e o design reforca essa clareza 1:1.
8. **Acessivel por padrao.** Contraste AA no minimo (AAA no texto principal), foco sempre visivel, `prefers-reduced-motion` respeitado.

---

## 2. Tokens de Cor

### 2.1 Paleta primitiva (escala neutral)

Base = escala `neutral` do Tailwind. Branco puro, quase-preto e nove cinzas. Esta e a **unica** paleta cromatica do produto (fora `destructive`).

| Token primitivo | HEX | HSL (shadcn) | Uso tipico |
|---|---|---|---|
| `white`      | `#FFFFFF` | `0 0% 100%`   | Fundo de app, fundo de card |
| `neutral-50` | `#FAFAFA` | `0 0% 98%`    | `foreground` no dark, hovers muito sutis |
| `neutral-100`| `#F5F5F5` | `0 0% 96.1%`  | **Hover/ativo de sidebar**, muted, accent |
| `neutral-200`| `#E5E5E5` | `0 0% 89.8%`  | **Border**, input border, divisores |
| `neutral-300`| `#D4D4D4` | `0 0% 83.1%`  | Border em hover, skeleton base |
| `neutral-400`| `#A3A3A3` | `0 0% 63.9%`  | Icones desabilitados, placeholders |
| `neutral-500`| `#737373` | `0 0% 45.1%`  | **Texto muted / meta** (piso de contraste em branco) |
| `neutral-600`| `#525252` | `0 0% 32.2%`  | Texto secundario forte |
| `neutral-700`| `#404040` | `0 0% 25.1%`  | Icones ativos |
| `neutral-800`| `#262626` | `0 0% 14.9%`  | Superficie dark, borders dark |
| `neutral-900`| `#171717` | `0 0% 9%`     | **Primary** (botao/acento monocromatico) |
| `neutral-950`| `#0A0A0A` | `0 0% 3.9%`   | **Foreground** (texto principal, "quase-preto") |

> **Regra de contraste:** nunca use texto mais claro que `neutral-500` (`#737373`) sobre branco — abaixo disso o contraste cai de AA. `neutral-500` sobre `white` = ~4.6:1 (passa AA para corpo).

### 2.2 Cor de sistema (unica excecao cromatica)

| Token | HEX (light) | HSL | Uso |
|---|---|---|---|
| `destructive` | `#EF4444` | `0 84.2% 60.2%` | Somente erro/exclusao destrutiva. Nunca decorativo. |

### 2.3 CSS variables semanticas (contrato shadcn) — cole em `globals.css`

Convencao shadcn: valores HSL **sem** o wrapper `hsl()`. `--radius` incluido aqui (ver secao 5).

```css
/* app/globals.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;

    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;

    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;

    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;

    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;

    --accent: 0 0% 96.1%;          /* hover/ativo de sidebar e itens interativos */
    --accent-foreground: 0 0% 9%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;

    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;             /* anel de foco: quase-preto */

    --radius: 0.75rem;

    /* Tokens especificos do BusinessOS (nao-shadcn) */
    --sidebar-width: 16rem;        /* 256px */
    --sidebar-width-collapsed: 4rem;
    --content-max: 80rem;          /* 1280px, largura util maxima da area de cards */
  }

  /* Dark mode: opcional/futuro. P&B se inverte de forma limpa. */
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;

    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;

    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;

    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;

    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;

    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;

    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;

    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

> **Nota de escopo:** o design P&B funciona em light por padrao. O bloco `.dark` fica documentado e pronto, mas o produto entrega **light-first**; ativar dark mode e opcional e nao bloqueia nenhum entregavel.

---

## 3. Tipografia — Inter

### 3.1 Setup (Next.js `next/font`)

```ts
// app/fonts.ts
import { Inter } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
```

```tsx
// app/layout.tsx  ->  <html className={inter.variable}> ; body usa font-sans
```

`font-feature-settings` recomendado no `body` para numeros tabulares (relevante em `fluxo-de-caixa`):

```css
body {
  font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.tabular { font-feature-settings: "tnum" 1, "cv01" 1; } /* aplicar em valores $ */
```

### 3.2 Escala tipografica (mapeia 1:1 aos utilitarios Tailwind)

| Papel semantico | Classe Tailwind | Tamanho / line-height | Peso | Tracking |
|---|---|---|---|---|
| Display (raro, hero) | `text-4xl` | 2.25rem / 2.5rem | 700 | -0.02em |
| Titulo de pagina (secao) | `text-3xl` | 1.875rem / 2.25rem | 600 | -0.02em |
| Subtitulo / grupo | `text-2xl` | 1.5rem / 2rem | 600 | -0.01em |
| Titulo de card (h3) | `text-base` | 1rem / 1.5rem | 600 | -0.01em |
| Corpo | `text-sm` | 0.875rem / 1.25rem | 400 | 0 |
| Corpo grande (leitura de MD) | `text-base` | 1rem / 1.625rem | 400 | 0 |
| Meta / legenda | `text-xs` | 0.75rem / 1rem | 400–500 | 0 |
| Label de form / nav | `text-sm` | 0.875rem / 1.25rem | 500 | 0 |
| Overline (rotulo de secao na sidebar) | `text-xs` uppercase | 0.6875rem / 1rem | 600 | 0.06em |
| Codigo / mono (frontmatter) | `text-sm font-mono` | 0.875rem / 1.25rem | 400 | 0 |

**Pesos disponiveis:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold). Evitar 800/900 — pesado demais para o tom calmo.

**Regras:**
- Titulos usam tracking negativo leve (Inter fica "solto" em tamanhos grandes).
- Um card tem **exatamente um** `text-base font-semibold` (o titulo). Tudo mais e `text-sm`/`text-xs`.
- Corpo de leitura do MD renderizado usa `text-base` com `leading-relaxed` para conforto.

---

## 4. Espacamentos

Base de **4px** (escala nativa do Tailwind — `1` = 0.25rem = 4px). Nao inventar valores fora da escala.

| Token | rem | px | Uso canonico |
|---|---|---|---|
| `0.5` | 0.125 | 2  | Ajuste otico fino |
| `1`   | 0.25  | 4  | Gap icone↔texto minimo |
| `2`   | 0.5   | 8  | Padding interno compacto, gap de badges |
| `3`   | 0.75  | 12 | **Padding-x de item de sidebar**, gap em listas |
| `4`   | 1     | 16 | **Gap de grid de cards**, padding de card compacto |
| `5`   | 1.25  | 20 | **Padding interno de card (grid)** |
| `6`   | 1.5   | 24 | Padding de containers, gap de secoes |
| `8`   | 2     | 32 | Padding da area de conteudo (desktop) |
| `10`  | 2.5   | 40 | **Altura de item de sidebar / input / botao** |
| `12`  | 3     | 48 | Espaco entre header da pagina e grid |
| `16`  | 4     | 64 | Blocos de estado vazio |

**Tokens de layout:**
- Sidebar: largura `16rem` (256px), `--sidebar-width`.
- Area de conteudo: padding `px-6 md:px-8 py-6`, largura maxima `--content-max` (80rem) centralizada.
- Header da pagina de secao: `mb-6` a `mb-8` antes do grid.
- Gap entre cards: `gap-4` (16px) em grid; `gap-2` (8px) entre linhas em lista.

---

## 5. Escala de Radius (arredondado)

Base `--radius: 0.75rem` (12px). Derivados via `calc()`, mapeados no Tailwind (secao 8).

| Token Tailwind | Formula | px | Uso |
|---|---|---|---|
| `rounded-sm` | `calc(var(--radius) - 4px)` | 8  | Badges retangulares, chips pequenos |
| `rounded-md` | `calc(var(--radius) - 2px)` | 10 | **Inputs, selects, botoes** |
| `rounded-lg` | `var(--radius)` | 12 | **Item de sidebar**, popover, dialog |
| `rounded-xl` | `calc(var(--radius) + 4px)` | 16 | **Card (grid e lista)** |
| `rounded-2xl`| `calc(var(--radius) + 12px)`| 24 | Superficies grandes / hero |
| `rounded-full`| `9999px` | — | Badges de status (pilula), avatar, dot |

**Guia por componente:**
- **Card:** `rounded-xl` (16px).
- **Item de sidebar:** `rounded-lg` (12px).
- **Botao / input / select:** `rounded-md` (10px).
- **Badge de status:** `rounded-full`.
- **Skeleton:** herda o raio do elemento que substitui.

---

## 6. Elevacao & Bordas

Minimalismo = **borda primeiro, sombra depois**.

| Nivel | Estilo | Uso |
|---|---|---|
| Flat | `border border-border` | Card em repouso, inputs |
| Hover | `border-neutral-300` + `shadow-sm` | Card em hover, item interativo |
| Elevado | `shadow-md` | Popover, dropdown do select |
| Modal | `shadow-lg` + overlay `bg-black/40` | Dialog/drawer de edicao |

```
shadow-xs : 0 1px 2px 0 rgb(0 0 0 / 0.04)
shadow-sm : 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)
shadow-md : 0 4px 12px -2px rgb(0 0 0 / 0.08)
shadow-lg : 0 12px 32px -8px rgb(0 0 0 / 0.12)
```

Transicoes: `transition-colors`/`transition-shadow`, duracao **150ms**, easing `ease-out`. Nunca acima de 200ms.

---

## 7. Especificacoes de Componentes

### 7.1 Sidebar

Coluna fixa a esquerda, `--sidebar-width` (256px), altura total, `bg-background`, `border-r border-border`. Contem a marca no topo e a lista das **4 secoes** (`founder`, `direcao`, `validacao`, `caixa`).

**Estrutura:**
```
<aside> (w-64, border-r, flex-col)
 ├─ Brand      (h-14, px-4, "BusinessOS")
 ├─ <nav> (flex-1, px-3, py-2, space-y-1)
 │   ├─ overline "SECOES" (opcional, px-3, py-2)
 │   └─ NavItem × 4  (founder | direcao | validacao | caixa)
 └─ Footer     (px-4, py-3, meta: versao / status)
```

**NavItem — tokens:**

| Propriedade | Valor |
|---|---|
| Altura | `h-10` (40px) |
| Padding | `px-3` |
| Raio | `rounded-lg` |
| Layout | `flex items-center gap-3` (icone 16–18px + label) |
| Tipografia | `text-sm font-medium` |
| Icone | `size-4`, `text-muted-foreground` |

**Estados:**

| Estado | Fundo | Texto | Icone | Extra |
|---|---|---|---|---|
| Repouso | transparente | `text-muted-foreground` | `text-muted-foreground` | — |
| **Hover** | `bg-accent` (neutral-100) | `text-foreground` | `text-foreground` | `transition-colors 150ms` |
| **Ativo** | `bg-accent` (neutral-100) | `text-foreground` | `text-foreground` | `font-semibold` + rail: `border-l-2 border-foreground` (ou pseudo-elemento 2px) + `aria-current="page"` |
| Foco | herda hover | — | — | `outline-none` + `ring-2 ring-ring ring-offset-2 ring-offset-background` |
| Desabilitado | transparente | `text-neutral-400` | `text-neutral-400` | `pointer-events-none` |

> **Diferenciacao ativo vs hover em P&B:** como ambos usam `bg-accent`, o **ativo** se distingue por `font-semibold` + indicador (rail de 2px a esquerda) + `aria-current`. Isso mantem o sinal claro sem introduzir cor.

**Snippet:**
```tsx
<Link
  href="/direcao"
  aria-current={active ? "page" : undefined}
  className={cn(
    "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium",
    "text-muted-foreground transition-colors",
    "hover:bg-accent hover:text-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    active && "bg-accent text-foreground font-semibold",
  )}
>
  <Compass className="size-4 shrink-0" aria-hidden />
  <span>Direcao</span>
</Link>
```

**Responsivo:** abaixo de `md`, sidebar vira drawer (Sheet do shadcn) acionado por botao hamburguer no header; tokens identicos.

---

### 7.2 Card (entidade)

Cada card = **1 entidade = 1 arquivo `content/<secao>/<entidade>.md`**. Duas variantes controladas pelo view-toggle: **grid** e **lista**. Mesmo dado, layouts distintos.

**Anatomia (dados vindos do frontmatter + corpo):**
- `titulo` (frontmatter) → titulo do card.
- `status` (`rascunho | em-progresso | validado`) → badge.
- `atualizado_em`, `tags` → meta.
- Excerto do corpo MD (primeiras linhas) → preview.
- Acao primaria: **Editar** (abre form). Card inteiro navega para a entidade.

#### Variante GRID

| Propriedade | Valor |
|---|---|
| Container | `rounded-xl border border-border bg-card p-5` |
| Layout | `flex flex-col gap-3`, altura minima `min-h-40` |
| Hover | `hover:border-neutral-300 hover:shadow-sm transition` |
| Titulo | `text-base font-semibold text-card-foreground` |
| Status | badge no topo-direito (`justify-between` com o titulo) |
| Excerto | `text-sm text-muted-foreground line-clamp-2` |
| Meta (rodape) | `text-xs text-muted-foreground`, `atualizado_em` + tags |
| Grid pai | `grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` (ou `auto-fill minmax(18rem,1fr)`) |

```tsx
<article className="group flex min-h-40 flex-col gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-neutral-300 hover:shadow-sm">
  <header className="flex items-start justify-between gap-2">
    <h3 className="text-base font-semibold leading-snug">{titulo}</h3>
    <StatusBadge status={status} />
  </header>
  <p className="line-clamp-2 text-sm text-muted-foreground">{excerto}</p>
  <footer className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
    <span>Atualizado {atualizado_em}</span>
    <TagList tags={tags} />
  </footer>
</article>
```

#### Variante LISTA

Linha densa, largura total. Mesma informacao, na horizontal.

| Propriedade | Valor |
|---|---|
| Container | `rounded-lg border border-border bg-card px-4 py-3` |
| Layout | `flex items-center gap-4` |
| Titulo | `text-sm font-semibold` (sem quebra: `truncate`) |
| Excerto | `text-sm text-muted-foreground truncate` (flex-1, some em telas estreitas) |
| Status | badge, largura fixa a direita |
| Meta | `text-xs text-muted-foreground`, so `atualizado_em` (tags ocultas em <lg) |
| Acao | icone chevron/editar a extrema direita (`size-4`) |
| Lista pai | `flex flex-col gap-2` |

```tsx
<article className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition hover:border-neutral-300">
  <div className="min-w-0 flex-1">
    <h3 className="truncate text-sm font-semibold">{titulo}</h3>
    <p className="truncate text-xs text-muted-foreground">{excerto}</p>
  </div>
  <span className="hidden text-xs text-muted-foreground lg:block">{atualizado_em}</span>
  <StatusBadge status={status} />
  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
</article>
```

#### Badge de status (monocromatico)

P&B puro: diferenciacao por **preenchimento + dot**, nao por cor.

| Status | Estilo do badge | Dot |
|---|---|---|
| `rascunho` | `rounded-full border border-border bg-transparent text-muted-foreground px-2 py-0.5 text-xs` | anel vazado `border` |
| `em-progresso` | `rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs` | `bg-neutral-400` |
| `validado` | `rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium` | `bg-primary-foreground` (ou icone check `size-3`) |

> Mantem-se a hierarquia (rascunho → em-progresso → validado) por **intensidade de preenchimento** crescente, sem sair do P&B.

---

### 7.3 View-toggle (grid ↔ lista)

**Um unico controle select** (conforme briefing — nao um segmented toggle). Componente `Select` do shadcn, no header da pagina de secao, alinhado a direita.

| Propriedade | Valor |
|---|---|
| Componente | shadcn `Select` |
| Trigger | `h-9`/`h-10`, `rounded-md`, `text-sm`, largura `~9rem` |
| Label acessivel | `aria-label="Visualizacao"` (ou `<label>` visualmente oculto) |
| Opcoes | `grid` → "Grade" · `list` → "Lista" |
| Icone (opcional) | grade `LayoutGrid` / lista `List` no item, decorativo |
| Persistencia | `localStorage["businessos.view"]`; default `grid` |
| Estado | valor controla qual variante de card renderiza |

```tsx
<div className="flex items-center justify-between">
  <h1 className="text-3xl font-semibold tracking-tight">Direcao</h1>
  <div className="flex items-center gap-2">
    <label htmlFor="view" className="sr-only">Visualizacao</label>
    <Select value={view} onValueChange={setView}>
      <SelectTrigger id="view" className="h-9 w-36 rounded-md text-sm">
        <SelectValue placeholder="Visualizacao" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="grid">Grade</SelectItem>
        <SelectItem value="list">Lista</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>
```

---

## 8. Uso e Theming do shadcn/ui

### 8.1 Contrato

- Todos os componentes shadcn consomem as **CSS variables** da secao 2.3. Trocar tema = trocar variaveis; **nunca** hardcode de cor dentro de componente.
- `components.json`: `style: "new-york"` (mais enxuto/minimalista), `baseColor: "neutral"`, `cssVariables: true`. Combina exatamente com os tokens acima.
- Componentes shadcn previstos: `Button`, `Card`, `Select`, `Badge`, `Input`, `Textarea`, `Label`, `Dialog`/`Sheet` (form de edicao), `Skeleton`, `Separator`, `Tooltip`, `Sonner` (toast).

### 8.2 `tailwind.config.ts` — extend (drop-in)

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 12px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 8.3 Storybook

- Cada primitivo (`NavItem`, `Card` grid/lista, `StatusBadge`, `ViewToggle`, estados) tem `*.stories.tsx`.
- Um **decorator global** injeta os tokens (`globals.css`) e um toggle de tema (light/dark) via `data-theme`/classe `.dark`, para validar ambos os temas.
- Stories obrigatorias por componente: `Default`, `Hover`, `Active` (quando aplicavel), `Loading`, `Empty`, `Error`/`Disabled`.

---

## 9. Estados: Vazio, Loading, Edicao

### 9.1 Estado vazio (empty)

Quando uma secao nao tem entidades ou uma busca/filtro nao retorna cards.

| Propriedade | Valor |
|---|---|
| Container | centralizado, `flex flex-col items-center gap-3 py-16 text-center` |
| Icone | `size-10 text-neutral-400` (decorativo, `aria-hidden`) |
| Titulo | `text-base font-semibold` — ex.: "Nada por aqui ainda" |
| Descricao | `text-sm text-muted-foreground max-w-sm` — explica o que a secao guarda |
| Acao | `Button` primario "Criar {entidade}" (`bg-primary text-primary-foreground rounded-md`) |
| Borda opcional | `rounded-xl border border-dashed border-border` envolvendo o bloco |

Texto por secao deve refletir o proposito (ex.: em `validacao` → "Registre seus primeiros clientes para comecar a validar").

### 9.2 Loading (skeleton)

Enquanto os MD sao lidos do filesystem. **Skeletons espelham a forma final** (evita layout shift).

- **Grid:** N cards skeleton = `rounded-xl border border-border p-5` contendo barras `bg-muted rounded-md animate-pulse` (titulo `h-4 w-2/3`, linhas `h-3 w-full` + `w-4/5`, badge `h-5 w-16 rounded-full`).
- **Lista:** linhas skeleton `h-14 rounded-lg border` com `animate-pulse`.
- Animacao: `animate-pulse` (pausar sob `prefers-reduced-motion`).
- Acessibilidade: container `aria-busy="true"`; skeletons `aria-hidden`; opcional `aria-live="polite"` anunciando "Carregando...".
- **Form salvando:** botao "Salvar" entra em estado `disabled` com spinner `size-4 animate-spin` + texto "Salvando...".

```tsx
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
  {Array.from({ length: 6 }).map((_, i) => (
    <div key={i} className="flex min-h-40 flex-col gap-3 rounded-xl border border-border p-5" aria-hidden>
      <Skeleton className="h-4 w-2/3 rounded-md" />
      <Skeleton className="h-3 w-full rounded-md" />
      <Skeleton className="h-3 w-4/5 rounded-md" />
      <Skeleton className="mt-auto h-5 w-16 rounded-full" />
    </div>
  ))}
</div>
```

### 9.3 Edicao (form)

Criar/editar uma entidade = editar seu arquivo MD (frontmatter + corpo). Superficie: **`Dialog` (desktop) ou `Sheet` (mobile / forms longos)**.

| Elemento | Token/Spec |
|---|---|
| Container | `Dialog`/`Sheet`, `rounded-lg`, `shadow-lg`, overlay `bg-black/40`, largura `max-w-lg` |
| Titulo | `text-lg font-semibold` — "Editar {titulo}" |
| Campos de frontmatter | `Input`/`Select` (`h-10 rounded-md border-input`), `Label text-sm font-medium` |
| Corpo MD | `Textarea` `font-mono text-sm rounded-md min-h-48`, autosize; opcional preview MD lado a lado |
| Ajuda | `text-xs text-muted-foreground` sob campos |
| Acoes | rodape `flex justify-end gap-2`: `Button variant="ghost"` (Cancelar) + `Button` (Salvar) |
| Estado dirty | guarda de saida: confirmar descarte se ha alteracoes nao salvas |
| Sucesso | toast (`Sonner`) "Alteracoes salvas" + card reflete novo `atualizado_em` |
| Erro | mensagem inline em `text-destructive text-sm`; campo com `border-destructive` + `aria-invalid` |
| Foco | ao abrir, foco no primeiro campo; `Esc` fecha; foco fica preso no dialog (focus trap do Radix) |

---

## 10. Notas de Acessibilidade

**Contraste (WCAG):**
- Texto principal `foreground` (`#0A0A0A`) sobre `background` (`#FFF`) ≈ 19:1 → AAA.
- `muted-foreground` (`#737373`) sobre branco ≈ 4.6:1 → AA (corpo). **Piso**: nao clarear texto alem de `neutral-500`.
- `neutral-400` (`#A3A3A3`) so para elementos **nao-textuais** (icones decorativos, placeholders, bordas) — nao passa AA como texto.
- Badge `validado` (`primary-foreground` sobre `primary`) = inversao total → AAA.

**Foco:**
- Todo elemento interativo tem `focus-visible:ring-2 ring-ring ring-offset-2 ring-offset-background`. O anel usa `--ring` (quase-preto no light, cinza claro no dark) — visivel em ambos os temas.
- Nunca `outline: none` sem substituto visivel.

**Teclado & navegacao:**
- Sidebar: itens sao `<a>`/`<Link>` em `<nav aria-label="Secoes">`; item ativo com `aria-current="page"`. Ordem de tab natural.
- View-toggle: `Select` totalmente operavel por teclado (Radix); rotulo associado.
- Card: se o card inteiro e clicavel, usar um `<a>` cobrindo o titulo (evitar `onClick` em `div`); acoes secundarias (editar) como `<button>` separados, fora do link, para nao aninhar interativos.
- Dialog/Sheet: focus trap, retorno de foco ao gatilho no fechamento, `Esc` fecha.

**Semantica:**
- Cada card e `<article>` com um unico `<h3>` (titulo). Titulo da pagina de secao e `<h1>`.
- Icones decorativos: `aria-hidden`. Icones que carregam significado sozinhos: `aria-label`.
- Estados de status nao dependem so de forma/preenchimento: o **texto** do badge ("Rascunho"/"Em progresso"/"Validado") sempre acompanha — nunca so o dot (garante daltonismo/monocromia).

**Movimento:**
- Todas as transicoes <= 200ms, `ease-out`.
- `@media (prefers-reduced-motion: reduce)`: desativar `animate-pulse`, `transition`, `animate-spin` (ou reduzir a fade minimo).

**Alvos de toque:**
- Minimo 40×40px (`h-10`) em itens de sidebar, botoes e triggers. Espacamento entre alvos >= 8px.

**Idioma:**
- `<html lang="pt-BR">`. Rotulos/ARIA em pt-BR; identificadores/valores de token permanecem em ingles.

---

## 11. Checklist de Fidelidade (Definition of Done visual)

- [ ] Somente tokens da secao 2 (P&B + `destructive`); zero cor hardcoded fora das CSS variables.
- [ ] Inter carregada via `next/font` com `--font-sans`; escala da secao 3 respeitada.
- [ ] Raio base `0.75rem`; cards `rounded-xl`, sidebar `rounded-lg`, inputs `rounded-md`.
- [ ] Sidebar com 4 secoes, hover `bg-accent`, ativo com `font-semibold` + rail + `aria-current`.
- [ ] Cards em grid **e** lista, alternados por **um** `Select` (grid/list) persistido.
- [ ] Badge de status monocromatico com texto sempre presente.
- [ ] Estados vazio / loading (skeleton) / edicao (dialog) implementados.
- [ ] Foco visivel em tudo; contraste AA+; `prefers-reduced-motion` respeitado.
- [ ] Cada primitivo com stories no Storybook (light + dark).

---

## 12. Dependencias a Jusante

- **Spec de componentes / Storybook** — implementa `NavItem`, `Card` (grid/lista), `StatusBadge`, `ViewToggle`, `EmptyState`, `Skeletons`, `EditDialog` a partir destes tokens.
- **Spec de UI/paginas** — monta as 4 paginas de secao usando a sidebar e a grade de cards aqui definidas.
- **Modelo de dados / conteudo** — fornece os campos de frontmatter (`titulo`, `status`, `atualizado_em`, `tags`) que os cards e o form renderizam.
- **Arquitetura** — confirma o setup de `next/font`, `tailwind.config.ts`, `globals.css` e `components.json` (shadcn) descritos aqui.
