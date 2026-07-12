---
doc: technical-spec
title: Especificacao Tecnica (Arquitetura & Stack)
status: derivado
deriva_de: 00-briefing
versao: 1.0.0
owner: ruanbraz@overlens.com.br
atualizado_em: 2026-07-11
tags: [arquitetura, nextjs, app-router, server-actions, gray-matter, shadcn, storybook, supabase, testes, scaffold]
depends_on: [docs/00-briefing.md, docs/01-prd.md, docs/02-content-model.md, docs/03-design-system.md]
---

# BusinessOS — Especificacao Tecnica (Arquitetura & Stack)

> **Documento derivado.** Traduz o briefing canonico (`docs/00-briefing.md`), o PRD
> (`docs/01-prd.md`), o modelo de conteudo (`docs/02-content-model.md`) e o design
> system (`docs/03-design-system.md`) em uma **arquitetura implementavel**. Em caso de
> conflito de visao/escopo, o briefing prevalece; sobre a **forma dos arquivos de
> conteudo**, `docs/02-content-model.md` e a autoridade; sobre **tokens/componentes
> visuais**, `docs/03-design-system.md`. Este doc e a autoridade sobre **estrutura de
> pastas, camadas, fluxo de escrita, config e ferramentas**.
>
> Regra de ouro que atravessa tudo: **uma unica fonte de verdade por entidade, atras de
> uma porta unica** (`lib/content/repository`). A UI e um editor dessa fonte; agentes
> leem/escrevem a mesma fonte pela mesma porta. Nenhum estado paralelo.

> **ATUALIZACAO — ADR 0001 (persistencia Supabase multi-tenant).** Este doc foi escrito
> para a fase "Markdown como fonte unica, zero banco". Desde o **ADR 0001**
> (`docs/decisions/0001-persistencia-supabase-multitenant.md`), a persistencia de
> **producao** e **Postgres/Supabase, multi-tenant, com autenticacao**; o modo `file`
> (arquivos MD) continua como fallback de dev/testes/rollback, atras da **mesma**
> interface `ContentStore`. As camadas 1–3 e os 11 call sites **nao mudaram de
> assinatura** — um contexto `AsyncLocalStorage` resolve o tenant (ver §2 e §5.2). As
> secoes abaixo trazem notas de atualizacao onde a realidade mudou; a §11 (que previa
> "Supabase futuro, single-tenant") esta **SUBSTITUIDA** e reescrita como registro do que
> de fato foi implementado.

---

## 1. Decisoes de stack (fixadas)

Defaults do briefing (secao 8) + escolhas de versao para tornar o doc executavel. Nao
re-litigar sem motivo forte.

| Camada | Escolha | Nota |
|---|---|---|
| Framework | **Next.js (App Router)**, `>= 15` | React Server Components + Server Actions. `runtime = 'nodejs'` onde toca o filesystem. |
| Linguagem | **TypeScript** `>= 5.4`, `strict: true` | Sem `any` implicito; `noUncheckedIndexedAccess`. |
| UI runtime | **React 19** | `useActionState`/`useFormStatus` para forms. |
| Estilo | **Tailwind CSS `^3.4`** + **shadcn/ui** (new-york, base `neutral`, `cssVariables: true`) | **Pin em v3** para casar 1:1 com os tokens drop-in de `03-design-system.md` (`tailwind.config.ts` + `tailwindcss-animate` + HSL vars). Ver 8.1. |
| Fonte | **Inter** via `next/font/google` (`--font-sans`) | Setup identico a `03-design-system.md#3`. |
| Componentes | **Storybook `>= 8`** (builder Vite) | Um story por primitivo; decorator de tema. Secao 9. |
| Conteudo | **Markdown + frontmatter** em `content/`, parse por **`gray-matter`** | Contrato de `02-content-model.md`. Secao 5–6. |
| Validacao | **`zod`** | Schema unico compartilhado UI + agentes. |
| Persistencia (producao) | **Postgres/Supabase**, multi-tenant, atras da interface `ContentStore` (`SupabaseContentStore`) | `CONTENT_STORE=supabase`. Isolamento por RLS. Secao 5 e 11 + ADR 0001. |
| Persistencia (dev/fallback) | **Filesystem local** (`content/`), Node `fs/promises` (`FileContentStore`) | `CONTENT_STORE=file` (default). Rollback/testes. |
| Autenticacao | **Supabase Auth** (email+senha) via `@supabase/ssr` + `middleware.ts` | So no modo `supabase`. Tabela `profiles` com `role` (admin/member). ADR 0001 §4. |
| IA (runtime) | **Vercel AI SDK** + `@ai-sdk/anthropic` | "Cabo solto": liga quando `ANTHROPIC_API_KEY` existe (`AI_ENABLED`). ADR 0001 §6. |
| Storage | **Supabase Storage** — bucket privado `attachments` | Infra + RLS por usuario prontas; sem UI ainda. ADR 0001 §7. |
| Gerenciador de pacotes | **pnpm** (npm/yarn equivalentes anotados) | Comandos da secao 13 usam `pnpm dlx`. |
| Testes | **Vitest** (unit) + **Playwright** (e2e) + **Storybook test** (componentes) | Secao 12. |

> **Nota de atualizacao (ADR 0001).** A linha de persistencia acima foi reescrita: o
> "futuro Supabase" virou **producao** e ganhou **multi-tenant + auth + storage + IA**.
> As deps `@supabase/supabase-js`, `@supabase/ssr`, `ai`, `@ai-sdk/anthropic` e
> `server-only` **estao instaladas**.

**Nao-objetivos tecnicos** (redacao original do PRD §2.2, **parcialmente superada** pelo
ADR 0001): ~~sem banco conectado, sem auth/multiusuario~~ — hoje **ha** banco (Supabase)
e **auth multi-tenant**. Seguem fora de escopo: realtime, libs de estado pesadas
(Redux/Zustand/React Query), GraphQL, i18n. Estado de servidor = store (banco no modo
`supabase`, filesystem no modo `file`) via RSC; estado de cliente = URL + `localStorage`.

---

## 2. Arquitetura em camadas

Quatro camadas, dependencia so para baixo. A **fronteira dura** e a interface
`ContentStore`: e o unico ponto que muda quando trocarmos file -> Supabase.

```
┌───────────────────────────────────────────────────────────────┐
│ 1. UI (RSC + client components)                                │
│    app/(app)/[section]/page.tsx  ── lista cards (server read)  │
│    EntityForm (client) ── submit ─┐                            │
├───────────────────────────────────┼───────────────────────────┤
│ 2. Borda de escrita/leitura        ▼                           │
│    Server Actions  (app/**/actions.ts, "use server")           │
│    Route Handlers  (app/api/**, opcional p/ agentes remotos)   │
├───────────────────────────────────────────────────────────────┤
│ 3. Dominio de conteudo  (lib/content) ── porta unica           │
│    repository.ts  readEntity / listEntities / writeEntity      │
│    schema.ts (zod) · registry.ts · serialize.ts · errors.ts    │
│    regras: validacao · conflito otimista · write_policy ·      │
│            campos controlados pelo sistema · escrita atomica    │
├───────────────────────────────────────────────────────────────┤
│ 4. Persistencia  (lib/content/store) ── ContentStore interface │
│    FileContentStore    (modo file: gray-matter + fs)          │
│    SupabaseContentStore (modo supabase: tabela content_entities)│
│    + Contexto de tenant (lib/content/context.ts, AsyncLocalStorage)│
└───────────────────────────────────────────────────────────────┘
        Agentes/skills entram na camada 3 (mesmas funcoes da UI).
```

> **Nota de atualizacao (ADR 0001).** As **4 camadas continuam** e a fronteira dura
> segue sendo `ContentStore`. O que mudou na camada 4: o **`SupabaseContentStore` esta
> ativo** (contra a tabela `content_entities`, uma copia por usuario) e um **contexto de
> execucao via `AsyncLocalStorage`** (`lib/content/context.ts`) resolve **qual store /
> qual tenant** por request/processo. Os **pontos de entrada** (RSC, Server Actions,
> Route Handlers, CLIs) estabelecem o contexto uma vez — via `withUserContext` (usuario
> logado, RLS) ou `withAdminContext` (service_role + `userId` explicito, para CLI/ETL);
> o `getStore()` interno o le. **Assim as assinaturas de `readEntity`/`writeEntity`/
> `listEntities` — e os 11 call sites — nao mudaram.** Ver §5.2 e ADR 0001 §3.

Principios:

- **Camada 3 concentra as regras de dominio** (validacao Zod, conflito por `revision`,
  `write_policy`, campos de sistema imutaveis, ordenacao canonica de chaves). A camada 4
  so faz bytes/linhas (ou linhas de tabela) entrar e sair.
- **UI nunca toca `fs`, `gray-matter` nem o cliente Supabase direto para conteudo.**
  Sempre via camada 3.
- **Agentes usam a camada 3 in-process** (import de `lib/content/repository`), exatamente
  como as Server Actions. A REST (camada 2, `app/api`) e opcional para agentes que rodam
  fora do processo Node do app (P1).

---

## 3. Estrutura Next.js App Router

### 3.1 Route group + layout com sidebar

Um unico route group `(app)` carrega o **layout persistente** (sidebar + area de
conteudo). O root layout instala fonte, tema e toaster.

- **`app/layout.tsx`** (root): `<html lang="pt-BR" className={inter.variable}>`, `<body
  className="font-sans ...">`, `<Toaster/>` (Sonner). Metadata global.
- **`app/(app)/layout.tsx`**: grid `sidebar | main`. Renderiza `<Sidebar/>` (server
  component; itens vindos do `REGISTRY`/`SECTIONS`) + `<main>` com `max-w-[--content-max]`.
  A sidebar destaca a secao ativa lendo o segmento ativo (`aria-current="page"`).
- **`app/page.tsx`**: `redirect('/founder')` (R-NAV-05).

### 3.2 Uma page por secao — rota dinamica dirigida pelo registro

O briefing pede "uma page por secao". Em vez de 4 pastas quase identicas, usamos **um
segmento dinamico `[section]`** validado contra `sectionEnum` e materializado nas 4
secoes por `generateStaticParams`. Isso mantem a UI **dirigida pelo `REGISTRY`** (mesma
filosofia de fonte unica do modelo de conteudo) e evita divergencia entre paginas.

```ts
// app/(app)/[section]/page.tsx
import { notFound } from 'next/navigation';
import { sectionEnum } from '@/lib/content/schema';
import { listEntities } from '@/lib/content/repository';

export const runtime = 'nodejs';          // precisa de fs
export const dynamic = 'force-dynamic';   // sempre reflete o disco (round-trip fiel)

export function generateStaticParams() {
  return sectionEnum.options.map((section) => ({ section }));
}

export default async function SectionPage({
  params, searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { section } = await params;
  const parsed = sectionEnum.safeParse(section);
  if (!parsed.success) notFound();

  const { view } = await searchParams;                 // 'grid' | 'list'
  const entities = await listEntities(parsed.data);    // EntityMeta[] ordenado por order
  return <SectionView section={parsed.data} entities={entities} view={view ?? 'grid'} />;
}
```

> Alternativa considerada e rejeitada: 4 pastas explicitas (`app/(app)/founder/...`).
> Rejeitada por duplicacao; o segmento dinamico + `generateStaticParams` entrega o
> mesmo resultado (rotas estaticas `/founder`, `/direcao`, `/validacao`, `/caixa`) com
> uma so page. Se no futuro uma secao precisar de layout unico, promove-se so aquela.

### 3.3 Edicao: page + modal (parallel/intercepting routes)

Design system define edicao em **Dialog/Sheet** (`03-design-system.md#9.3`); PRD pede
**rota por entidade** (`/direcao/tese-de-valor`). Casamos os dois com o padrao Next.js
"modal que tambem e pagina":

- **`app/(app)/[section]/[entity]/page.tsx`** — pagina canonica de edicao (deep-link,
  refresh, acesso direto do agente/humano). Renderiza o `EntityForm` em pagina cheia.
- **`app/(app)/@modal/(.)[section]/[entity]/page.tsx`** — rota **interceptadora** +
  slot **paralelo** `@modal` no `app/(app)/layout.tsx`. Quando o founder clica num card,
  a navegacao e interceptada e o `EntityForm` abre em `Dialog`/`Sheet` sobre os cards.
  `default.tsx` do slot retorna `null`.

MVP pode enviar **apenas a pagina canonica** (mais simples) e adicionar o modal como
incremento — a URL e o comportamento de salvar sao identicos nos dois. Ambos montam o
mesmo `<EntityForm/>` a partir do `EntityDoc`.

### 3.4 Mapa de rotas

| Rota | Arquivo | Render | Proposito |
|---|---|---|---|
| `/` | `app/page.tsx` | server | Redireciona para `/founder`. |
| `/[section]` | `app/(app)/[section]/page.tsx` | server (dynamic) | Pagina de cards da secao. `?view=grid\|list`. |
| `/[section]/[entity]` | `app/(app)/[section]/[entity]/page.tsx` | server | Form de edicao (pagina cheia). |
| `/[section]/[entity]` (interceptada) | `app/(app)/@modal/(.)[section]/[entity]/page.tsx` | server + client dialog | Form em modal sobre os cards. |
| `POST` (action) | `app/(app)/[section]/[entity]/actions.ts` | server action | Salvar entidade. |
| `GET/PUT /api/entities/[section]/[entity]` | `app/api/entities/[section]/[entity]/route.ts` | route handler | **Opcional (P1)** superficie REST p/ agentes remotos. |

---

## 4. Arvore de pastas proposta (completa)

`app/` na raiz (sem `src/`), coerente com `03-design-system.md`. `content/` e `lib/`
tambem na raiz. Alias de import `@/*` -> raiz do projeto.

```
BusinessOS/
├── app/
│   ├── layout.tsx                 # root: html lang=pt-BR, Inter, <Toaster/>
│   ├── globals.css                # tokens/CSS vars (drop-in do design system)
│   ├── fonts.ts                   # Inter via next/font (design system #3.1)
│   ├── page.tsx                   # redirect('/founder')
│   ├── not-found.tsx
│   ├── error.tsx
│   ├── (app)/                     # route group com sidebar persistente
│   │   ├── layout.tsx             # sidebar + <main> + slot @modal
│   │   ├── default.tsx            # fallback do grupo (se necessario)
│   │   ├── [section]/
│   │   │   ├── page.tsx           # cards da secao (uma page p/ as 4 secoes)
│   │   │   ├── loading.tsx        # skeleton grid/lista (design system #9.2)
│   │   │   └── [entity]/
│   │   │       ├── page.tsx       # form de edicao (pagina canonica)
│   │   │       └── actions.ts     # "use server" saveEntity()
│   │   └── @modal/                # slot paralelo p/ edicao em modal
│   │       ├── default.tsx        # null
│   │       └── (.)[section]/[entity]/page.tsx   # rota interceptadora
│   └── api/
│       └── entities/
│           └── [section]/[entity]/route.ts      # opcional (P1): GET/PUT p/ agentes
│
├── components/
│   ├── ui/                        # primitivos shadcn (button, card, select, badge...)
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── nav-item.tsx
│   ├── entities/
│   │   ├── entity-card.tsx        # variante grid
│   │   ├── entity-card-row.tsx    # variante lista
│   │   ├── entity-card-grid.tsx   # container responsivo
│   │   ├── entity-form.tsx        # form frontmatter + corpo (client)
│   │   ├── status-badge.tsx
│   │   ├── view-toggle.tsx        # Select grid/lista (client)
│   │   └── empty-state.tsx
│   └── providers.tsx              # Toaster, (futuro) ThemeProvider
│
├── lib/
│   ├── content/
│   │   ├── schema.ts              # tipos TS + Zod (02-content-model.md #7)
│   │   ├── registry.ts            # REGISTRY das 11 entidades (#8.1)
│   │   ├── entity-extensions.ts   # campos por-tipo (#8.2)
│   │   ├── templates.ts           # headings de corpo por entidade (#8.3)
│   │   ├── serialize.ts           # gray-matter parse + stringify c/ ordem canonica
│   │   ├── repository.ts          # readEntity/listEntities/writeEntity (regras)
│   │   ├── errors.ts              # ConflictError/ValidationError/PolicyError/NotInRegistryError
│   │   ├── labels.ts              # SECTION_LABEL / STATUS_LABEL (enum -> pt-BR)
│   │   ├── context.ts             # ContentContext + AsyncLocalStorage (ADR 0001 §3)
│   │   ├── session.ts             # withUserContext / withAdminContext / seedEntitiesForUser
│   │   └── store/
│   │       ├── types.ts           # interface ContentStore + RawDoc
│   │       ├── file-store.ts      # FileContentStore (fs + gray-matter) — modo file
│   │       ├── supabase-store.ts  # SupabaseContentStore (content_entities) — modo supabase
│   │       └── index.ts           # getStore(): resolve pelo contexto de execucao
│   ├── supabase/                  # clientes: client (browser) / server (RSC) / admin / middleware
│   ├── config.ts                  # env validado por zod (secao 10) + AI_ENABLED
│   └── utils.ts                   # cn() (clsx + tailwind-merge)
│
├── content/                       # FONTE UNICA — 11 arquivos MD (02-content-model #3)
│   ├── founder/{objetivo,estilo-de-vida}.md
│   ├── direcao/{mapa-do-mercado,ima-de-problemas,perfil-ideal-de-cliente,tese-de-valor,oferta}.md
│   ├── validacao/{oferta,primeiros-clientes}.md
│   └── caixa/{fluxo-de-caixa,erp}.md
│
├── scripts/
│   ├── seed-content.ts            # cria os 11 arquivos ausentes a partir do REGISTRY
│   └── validate-content.ts        # valida todo content/ (CI); falha se invalido
│
├── stories/ | *.stories.tsx       # co-locadas em components/** (ver secao 9)
├── tests/
│   ├── unit/                      # Vitest: schema, repository, store
│   └── e2e/                       # Playwright: round-trip de arquivo
│
├── .storybook/{main.ts,preview.tsx}
├── public/
├── app/globals.css                # (listado acima em app/)
├── components.json                # config shadcn (new-york, neutral, cssVariables)
├── tailwind.config.ts             # drop-in do design system #8.2
├── postcss.config.mjs
├── next.config.ts
├── tsconfig.json                  # paths: { "@/*": ["./*"] }
├── vitest.config.ts
├── playwright.config.ts
├── .env.example                   # vars (secao 10)
├── .env.local                     # local, git-ignored
├── package.json
└── README.md
```

---

## 5. Camada de persistencia — `ContentStore` (a fronteira de troca)

A interface e **proposital e minima**: so persistencia crua, sem regras de dominio.
Trocar file -> Supabase = implementar esta interface e mudar uma env var.

```ts
// lib/content/store/types.ts
export interface RawDoc {
  data: Record<string, unknown>;   // frontmatter cru (ainda nao validado)
  body: string;                    // Markdown apos o frontmatter
  path: string;                    // 'content/<section>/<entity>.md' (ou chave equivalente)
}

export interface ContentStore {
  /** Le o doc cru pelo id "<section>/<entity>"; null se nao existe. */
  read(id: string): Promise<RawDoc | null>;
  /** Lista docs crus (opcionalmente de uma secao). */
  list(section?: string): Promise<RawDoc[]>;
  /** Persiste (create/overwrite) de forma ATOMICA o doc cru. */
  write(id: string, doc: { data: Record<string, unknown>; body: string }): Promise<void>;
  /** Existencia rapida (para seeder / criacao). */
  exists(id: string): Promise<boolean>;
}
```

### 5.1 `FileContentStore` (hoje)

Usa `fs/promises` + `gray-matter`. Regras:

- **Resolucao de caminho:** `id "<section>/<entity>"` <-> `<CONTENT_ROOT>/<section>/<entity>.md`.
  `section` deve estar em `sectionEnum`; `entity` deve casar `^[a-z0-9-]+$`. Qualquer
  `..`/separador estranho e **rejeitado** (path traversal) antes de tocar o disco.
- **Parse:** `matter(fileString)` -> `{ data, content }`. Encoding UTF-8, normaliza CRLF
  -> LF na leitura (Windows-safe).
- **Escrita atomica:** grava em `*.tmp-<rand>` **no mesmo diretorio** e faz `fs.rename`
  por cima (rename e atomico no mesmo volume; evita arquivo meio-escrito visto por um
  agente concorrente). Cria o diretorio da secao com `mkdir({ recursive: true })` se
  ausente (R-EDIT-05).
- **Serializacao estavel:** ver 6.2 — `gray-matter.stringify` com objeto pre-montado na
  **ordem canonica** de chaves (diffs limpos no git).
- **`list`:** varre `<CONTENT_ROOT>/<section>/*.md`; ignora (com aviso) arquivos cujo
  `id` nao esteja no `REGISTRY` (a lista de verdade e o registro, nao o filesystem —
  `02-content-model.md#3`).

### 5.2 Selecao do store — por CONTEXTO (ADR 0001 §3)

> **Nota de atualizacao.** O `getStore()` deixou de ser um singleton global fixado por
> env. Agora ele **resolve o store do contexto de execucao** (`AsyncLocalStorage`), que
> ja vem escopado ao tenant certo. Sem contexto, so o modo `file` tem um store global
> valido (dev/testes/seed local); no modo `supabase` sem contexto e **erro explicito** —
> persistencia multi-tenant exige saber de quem sao os dados.

```ts
// lib/content/store/index.ts (essencia)
import { config } from '@/lib/config';
import { getContext } from '../context';
import { FileContentStore } from './file-store';
import type { ContentStore } from './types';

let fileStore: FileContentStore | null = null;

export function getStore(): ContentStore {
  const ctx = getContext();
  if (ctx) return ctx.store;                 // producao: store ja escopado ao tenant

  if (config.CONTENT_STORE === 'file') {     // sem contexto: so o file-store global vale
    if (!fileStore) fileStore = new FileContentStore(config.CONTENT_ROOT);
    return fileStore;
  }
  throw new Error('CONTENT_STORE=supabase exige um contexto de execucao (withUserContext / withAdminContext / runWithContext).');
}
```

Quem **estabelece** o contexto (`lib/content/session.ts`, server-only):

```ts
// UI (RSC / Server Actions / Route Handlers): resolve o usuario logado (cookies) e
// roda com um SupabaseContentStore em modo RLS. No modo file, roda como founder.
withUserContext<T>(fn: (user: SessionUser | null) => Promise<T>): Promise<T>

// CLIs / ETL / onboarding: age como `userId` explicito via service_role (contorna RLS).
withAdminContext<T>(userId: string, ownerEmail: string, fn: () => Promise<T>): Promise<T>

// Cria as 11 entidades vazias do tenant do contexto atual (idempotente; reusa REGISTRY
// + buildSeedFrontmatter). Roda DENTRO de um with*Context.
seedEntitiesForUser(): Promise<{ created: number; skipped: number }>
```

O `SupabaseContentStore` (`lib/content/store/supabase-store.ts`) implementa `ContentStore`
contra `content_entities` em **dois modos**: **RLS** (cliente `@supabase/ssr` autenticado,
`user_id` cai no default `auth.uid()`) para a UI, e **admin** (cliente `service_role` +
`actAsUserId` explicito) para CLI/ETL/seed. O conflito otimista e atomico no banco:
`UPDATE ... WHERE revision = base` — 0 linhas numa linha existente => `ConflictError`.

---

## 6. Camada de dominio — `lib/content/repository.ts`

Porta unica de `content/`. Reusa integralmente os tipos/algoritmos de
`02-content-model.md#7,#10`. Aqui detalhamos a **implementacao sobre o store**.

### 6.1 Assinaturas (contrato de `02-content-model.md#10.2`)

```ts
// lib/content/repository.ts
export async function readEntity(id: string): Promise<EntityDoc>;
export async function listEntities(section?: Section): Promise<EntityMeta[]>;
export async function writeEntity(input: WriteInput): Promise<EntityDoc>;

export interface WriteInput {
  id: string;
  editor: Editor;                         // 'founder' | 'system' | 'agent:<name>'
  baseRevision: number;                   // revision lido (conflito otimista)
  frontmatterPatch?: Partial<Frontmatter>;
  body?: string;
}
```

### 6.2 `writeEntity` — algoritmo (o coracao)

Reafirma `02-content-model.md#10.4`, situado nas camadas:

1. `id` no `REGISTRY`? senao `NotInRegistryError`.
2. `store.read(id)` -> `current` (pode ser seed).
3. **Conflito otimista:** `current.revision !== input.baseRevision` -> `ConflictError`.
4. **Politica:** `editor` comeca com `agent:` e `ai_context.write_policy === 'founder_only'`
   -> `PolicyError`.
5. Merge: `next = { ...current.frontmatter, ...frontmatterPatch }`.
6. **Campos controlados pelo sistema** (chamador nao decide): `updated = now()` (ISO
   8601 UTC), `revision = current.revision + 1`, `last_edited_by = editor`. **Imutaveis:**
   `id`, `section`, `entity`, `created`, `schema_version` (patch neles e ignorado).
7. **Fluxo de proposta:** `editor` agente + `write_policy === 'propose'` => força
   `next.status = 'needs_review'`.
8. Corpo: `input.body ?? current.body`.
9. **Valida** `next` com `frontmatterSchema.and(ENTITY_EXTENSIONS[id])` -> `ValidationError`.
10. Monta objeto na **ordem canonica** de chaves e serializa; `store.write(id, { data, body })`
    (atomico na camada 4).
11. Retorna o `EntityDoc` resultante.

> A UI carrega `baseRevision` no load da pagina de edicao; num `ConflictError`, mostra
> "o conteudo mudou, recarregue" (R-EDIT-07). Isso protege contra sobrescrita
> founder x agente sem merge (P1 hoje; merge = P2).

### 6.3 Ordem canonica de chaves (serialize.ts)

Sequencia fixa para diffs estaveis: `id, section, entity, title, status, summary, tags,
owner, order, created, updated, revision, last_edited_by, schema_version, ai_context,
<campos por-tipo em ordem alfabetica>`. `serialize.ts` monta um objeto novo nessa ordem
(JS preserva ordem de insercao de chaves string) e passa a `matter.stringify`.

### 6.4 `runtime = 'nodejs'`

Todo modulo que importa `lib/content/**` (Server Actions, Route Handlers, pages que
leem) roda no **runtime Node** (nao Edge) — precisa de `fs`. As pages de leitura usam
`export const runtime = 'nodejs'` e `export const dynamic = 'force-dynamic'` para
**sempre refletir o disco** (garante o round-trip fiel de CA-05..07).

---

## 7. Server Actions & Route Handlers (salvar cards)

### 7.1 Server Action (caminho primario da UI)

```ts
// app/(app)/[section]/[entity]/actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { writeEntity } from '@/lib/content/repository';
import { ConflictError, ValidationError, PolicyError } from '@/lib/content/errors';

export type SaveResult =
  | { ok: true; revision: number; updated: string }
  | { ok: false; kind: 'conflict' | 'validation' | 'policy' | 'unknown'; message: string;
      fieldErrors?: Record<string, string> };

export async function saveEntity(input: {
  id: string; baseRevision: number;
  frontmatterPatch: Record<string, unknown>; body: string;
}): Promise<SaveResult> {
  try {
    const doc = await writeEntity({
      id: input.id, editor: 'founder',            // UI = founder (agente usa a mesma fn server-side)
      baseRevision: input.baseRevision,
      frontmatterPatch: input.frontmatterPatch, body: input.body,
    });
    const [section] = input.id.split('/');
    revalidatePath(`/${section}`);                // atualiza a pagina de cards
    revalidatePath(`/${input.id}`);               // e a de edicao
    return { ok: true, revision: doc.frontmatter.revision, updated: doc.frontmatter.updated };
  } catch (e) {
    if (e instanceof ConflictError)   return { ok: false, kind: 'conflict',   message: 'O conteudo mudou desde que voce abriu. Recarregue e tente de novo.' };
    if (e instanceof ValidationError) return { ok: false, kind: 'validation', message: e.message, fieldErrors: (e as any).fieldErrors };
    if (e instanceof PolicyError)     return { ok: false, kind: 'policy',      message: 'Escrita bloqueada pela politica desta entidade.' };
    return { ok: false, kind: 'unknown', message: 'Falha ao salvar.' };
  }
}
```

Cliente (`entity-form.tsx`) consome com **`useActionState`** (React 19): estado
pendente desabilita "Salvar" com spinner (design system #9.2), sucesso dispara toast
Sonner "Alteracoes salvas", `conflict`/`validation` viram mensagem inline
(`text-destructive`, `aria-invalid`) sem perder o rascunho digitado.

### 7.2 Route Handlers (opcional, P1 — agentes remotos)

Para agentes que rodam **fora do processo** do app (ex.: worker/CLI separado que so fala
HTTP). Reusa o **mesmo** `repository`:

```ts
// app/api/entities/[section]/[entity]/route.ts
export const runtime = 'nodejs';
// GET  -> readEntity(id)               -> 200 EntityDoc | 404
// PUT  -> writeEntity({ editor:'agent:<name>', baseRevision, frontmatterPatch, body })
//         -> 200 EntityDoc | 409 ConflictError | 403 PolicyError | 422 ValidationError
```

> A maioria das skills/agentes roda **in-process** e importa `lib/content/repository`
> diretamente (contrato de `02-content-model.md#10.5`); a REST e so a ponte para atores
> externos. **Atualizacao (ADR 0001):** no modo `supabase` ha auth (Supabase Auth) e o
> `middleware` protege as rotas; um Route Handler exposto a atores externos deve rodar
> dentro de um `with*Context` para escopar o tenant (e, se exposto em rede, exigir token).

### 7.3 Seeder & validador (scripts)

- **`scripts/seed-content.ts`** (`pnpm seed`): para cada `EntityDef` do `REGISTRY`, se
  `!store.exists(id)`, cria o arquivo com o frontmatter seed de `02-content-model.md#8.4`
  (`status: empty`, `revision: 1`, `last_edited_by: system`) + corpo = H1 (`title`) + os
  `##` do template (`#8.3`). Idempotente. `editor: 'system'`.
- **`scripts/validate-content.ts`** (`pnpm content:check`): le **todos** os arquivos e
  valida com o schema; sai `1` se algum invalido ou com `id`/caminho divergente. Roda no
  CI (metrica "validade de frontmatter = 100%", PRD §10.2).

---

## 8. Setup shadcn + Tailwind + Inter

### 8.1 Tailwind v3 (pin) + tokens drop-in

**Decisao:** fixar **Tailwind `^3.4`** para que `tailwind.config.ts` e `globals.css` de
`03-design-system.md` sejam **drop-in** sem traducao. `create-next-app` recente pode
sugerir Tailwind v4 (sintaxe `@theme`); por isso o scaffold (secao 13) **nao** usa
`--tailwind` e instala v3 explicitamente. Se um dia migrarmos para v4, os tokens HSL
migram para `@theme` — trabalho localizado, documentado como P2.

Arquivos (conteudo exato ja especificado no design system):

- `tailwind.config.ts` — `darkMode: ['class']`, `content`, `fontFamily.sans =
  var(--font-sans)`, mapeamento de cores HSL, `borderRadius` via `--radius`, plugin
  `tailwindcss-animate` (`03-design-system.md#8.2`).
- `app/globals.css` — `@tailwind base/components/utilities` + as CSS vars `:root`/`.dark`
  (`03-design-system.md#2.3`), `* { @apply border-border }`, `body { @apply bg-background
  text-foreground }`.
- `postcss.config.mjs` — `tailwindcss` + `autoprefixer`.

### 8.2 shadcn/ui

`components.json` (bate com o design system):

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "tailwind.config.ts", "css": "app/globals.css",
    "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": { "components": "@/components", "ui": "@/components/ui",
    "lib": "@/lib", "utils": "@/lib/utils" }
}
```

Componentes a adicionar (design system #8.1): `button card select badge input textarea
label dialog sheet skeleton separator tooltip sonner`. `lib/utils.ts` traz `cn()`
(clsx + tailwind-merge), gerado pelo shadcn init.

### 8.3 Inter (next/font)

`app/fonts.ts` e o wiring do root layout sao identicos a `03-design-system.md#3.1`
(`Inter({ subsets:['latin'], variable:'--font-sans', display:'swap' })`;
`<html className={inter.variable}>`; `body` usa `font-sans`). Sem `<link>` externo — o
`next/font` self-hosta (bom para o CSP/offline e para o Storybook).

---

## 9. Setup do Storybook

- **Builder Vite** (`@storybook/nextjs-vite` ou `@storybook/nextjs`), Storybook `>= 8`.
- **Stories co-locadas**: `components/**/<name>.stories.tsx`. Cobertura obrigatoria dos
  primitivos-chave (PRD §10.2 = 100%): `NavItem`, `EntityCard` (grid), `EntityCardRow`
  (lista), `StatusBadge`, `ViewToggle`, `EmptyState`, skeletons, `EntityForm`/`EditDialog`.
  Variantes por story: `Default`, `Hover`, `Active`, `Loading`, `Empty`, `Error/Disabled`
  (`03-design-system.md#8.3`).
- **`.storybook/preview.tsx`**: importa `app/globals.css` (injeta tokens) e registra um
  **decorator de tema** (`@storybook/addon-themes` com `withThemeByClassName`) alternando
  a classe `.dark` — valida P&B em light e dark.
- **Addons**: `@storybook/addon-a11y` (checagem WCAG por story — casa com
  `03-design-system.md#10`), `@storybook/addon-themes`, essentials.
- **Fonte no Storybook**: como `next/font` so roda no build do Next, no preview aplicamos
  `--font-sans: 'Inter'` via `<style>` global no `preview.tsx` (Inter carregada localmente
  ou fallback system-ui) para nao depender de rede.
- **Mocks**: stories recebem `EntityMeta`/`EntityDoc` fixos (fixtures) — **nao** tocam
  `fs`. Primitivos sao puros de apresentacao; a leitura de conteudo fica nas pages RSC.

---

## 10. Env & config

`.env.local` (git-ignored) + `.env.example` versionado. Validacao por Zod em
`lib/config.ts` (falha cedo no boot se algo faltar), sem lib extra de env.

> **Nota de atualizacao (ADR 0001).** As vars Supabase deixaram de ser "futuras
> comentadas": no modo `supabase` sao **obrigatorias** (validadas por um `.refine`).
> Entraram tambem `SUPABASE_STORAGE_BUCKET` e `ANTHROPIC_API_KEY` (cabo solto da IA). Ver
> `.env.example` versionado.

```bash
# .env.example (resumo — ver o arquivo para os comentarios completos)
# --- Conteudo / seletor de persistencia ---
CONTENT_STORE=file                       # 'file' (default) | 'supabase' (producao)
CONTENT_ROOT=content                     # raiz dos MD (modo file)
FOUNDER_EMAIL=ruanbraz@overlens.com.br   # vira admin no signup; owner default no seed

# --- Supabase (OBRIGATORIAS quando CONTENT_STORE=supabase) ---
NEXT_PUBLIC_SUPABASE_URL=                 # vai ao browser (RLS por sessao)
NEXT_PUBLIC_SUPABASE_ANON_KEY=           # vai ao browser (anon)
SUPABASE_SERVICE_ROLE_KEY=               # SECRETA — so server-side (contorna RLS)

# --- Storage / IA ---
SUPABASE_STORAGE_BUCKET=attachments      # bucket privado de anexos (default)
ANTHROPIC_API_KEY=                       # presenca LIGA a IA no runtime (AI_ENABLED)
```

```ts
// lib/config.ts (essencia; SERVER-ONLY — le chaves secretas)
import { z } from 'zod';
const schema = z
  .object({
    CONTENT_STORE: z.enum(['file', 'supabase']).default('file'),
    CONTENT_ROOT: z.string().default('content'),
    FOUNDER_EMAIL: z.email().default('ruanbraz@overlens.com.br'),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default('attachments'),
  })
  .refine(
    (c) => c.CONTENT_STORE !== 'supabase' ||
      (c.NEXT_PUBLIC_SUPABASE_URL && c.NEXT_PUBLIC_SUPABASE_ANON_KEY && c.SUPABASE_SERVICE_ROLE_KEY),
    { message: 'CONTENT_STORE=supabase exige as 3 chaves Supabase.', path: ['CONTENT_STORE'] },
  );
export const config = schema.parse(process.env);
export const AI_ENABLED = Boolean(config.ANTHROPIC_API_KEY); // cabo solto da IA
```

Regras: **nenhuma credencial secreta no client** — `config`/`SUPABASE_SERVICE_ROLE_KEY`/
`ANTHROPIC_API_KEY` sao server-only; o browser le so `NEXT_PUBLIC_*` (o Next inlina no
bundle, ver `lib/supabase/client.ts`). As vars Supabase so sao exigidas quando
`CONTENT_STORE=supabase` (o `.refine` falha cedo no boot se faltarem).

---

## 11. Persistencia Supabase multi-tenant (IMPLEMENTADA — SUBSTITUI o plano futuro)

> **Esta secao foi SUBSTITUIDA pelo ADR 0001.** A redacao original previa Supabase como
> troca de camada 4 **single-tenant e sem auth**. O que de fato foi implementado e
> **maior**: multiusuario com autenticacao, RLS, storage e IA. O texto abaixo registra a
> realidade; a fonte canonica da decisao e `docs/decisions/0001-persistencia-supabase-multitenant.md`.

O contrato de dominio (camada 3) segue **intacto**: trocou-se a camada 4 e adicionou-se
um contexto de tenant, sem mexer nas assinaturas nem nos 11 call sites.

### 11.1 O que foi implementado

- **`SupabaseContentStore implements ContentStore`** (`lib/content/store/supabase-store.ts`)
  contra a tabela `content_entities`, que **espelha o frontmatter** (jsonb) + `body`, com
  **uma copia por usuario**. Modos RLS (UI) e admin/`service_role` (CLI/ETL/seed).
- **Multi-tenant por linha, isolado por RLS.** `content_entities` tem `user_id uuid` (FK
  `auth.users`) e **PK composta `(user_id, entity_id)`**. Toda policy filtra por
  `auth.uid()`. O `service_role` contorna a RLS para operacoes administrativas.
- **Contexto de tenant via `AsyncLocalStorage`** (`lib/content/context.ts` +
  `lib/content/session.ts`) — ver §2 e §5.2. E o que mantem as assinaturas de dominio
  inalteradas.
- **Autenticacao (Supabase Auth, email+senha)** via `@supabase/ssr` + `middleware.ts`
  (refresh de sessao + protecao de rotas; ativo so no modo `supabase`). Tabela `profiles`
  1:1 com `auth.users`, com `role` (`admin`|`member`) e trigger que provisiona o profile
  no signup (founder -> `admin`; demais -> `member`). Signup self-service.
- **Storage** (ADR §7): bucket privado `attachments` com policies RLS por usuario
  (primeiro segmento do caminho = `auth.uid()`). Infra pronta; sem UI de upload ainda.
- **IA integrada por "cabo solto"** (ADR §6): `AI_ENABLED` liga quando `ANTHROPIC_API_KEY`
  existe. Provider via Vercel AI SDK + `@ai-sdk/anthropic`. A IA escreve pela **mesma
  porta** (`repository` / `propose -> needs_review`).

### 11.2 DDL efetiva (migration aplicada)

`supabase/migrations/20260712104336_init_multitenant.sql` (essencia da tabela de conteudo):

```sql
create table public.content_entities (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity_id   text not null,                 -- '<section>/<entity>'
  section     text not null,
  frontmatter jsonb not null,                -- frontmatter completo (core + por-tipo)
  body        text not null default '',
  revision    integer not null default 1,    -- espelha frontmatter.revision (lock otimista)
  created     timestamptz not null default now(),
  updated     timestamptz not null default now(),
  primary key (user_id, entity_id)           -- uma copia por usuario
);
-- RLS: select/insert/update/delete WHERE auth.uid() = user_id. Indice (user_id, section).
```

- **Conflito otimista** = `UPDATE ... WHERE entity_id = $1 AND revision = $base` (+ filtro
  de tenant no modo admin); 0 linhas numa linha existente => `ConflictError`. Semantica
  **identica** a do file store (rename atomico + checagem de `revision`).
- **Escrita atomica** = o proprio `UPDATE` condicional do Postgres.
- Selecao por contexto (§5.2). O `repository` (camada 3) **nao muda uma linha**.

### 11.3 Admin semente e onboarding (ETL + seed)

- **Admin (founder):** um **ETL** deve ler `content/**/*.md` via `FileContentStore` e
  gravar no Supabase sob o `user_id` do admin (via `withAdminContext`), levando o conteudo
  real de hoje para o banco. Os arquivos em `content/` permanecem no repo como semente
  historica.
- **Novos usuarios:** o trigger cria o `profiles` no signup; o **seed das 11 entidades
  vazias** roda em TS (`seedEntitiesForUser`, reusa `REGISTRY` + `buildSeedFrontmatter`)
  no primeiro acesso/onboarding — nada de `REGISTRY` duplicado em SQL.

### 11.4 Estado da fiacao (verificado ponta a ponta)

Tudo abaixo foi **implementado e verificado** no modo `supabase` (isolamento RLS provado
com 2 tenants; ETL das 11 entidades para o admin; lock otimista/conflito no banco; build
verde nos dois modos):

- **Rotas de auth** — `app/(auth)/login`, `app/(auth)/signup`, `app/auth/signout`,
  layout proprio e o `middleware.ts` (padrao `@supabase/ssr`) protegendo o grupo `(app)`.
- **Script de ETL** — `scripts/migrate-to-supabase.ts` (`pnpm migrate:supabase`): le
  `content/**` via `FileContentStore` e faz upsert em `content_entities` sob o admin,
  preservando `revision`/`created`/`updated`/`status` 1:1. Idempotente.
- **`seedEntitiesForUser`** — chamada no `signUp` (novo usuario recebe as 11 entidades
  vazias). O admin recebe os dados reais via ETL.
- **CLIs de agente** (`agent:read`/`agent:write`/`seed`) e `create-admin`/`migrate:supabase`
  — embrulhados em `withAdminContext` (agem no tenant do admin, `service_role`). Rodam com
  `--env-file-if-exists=.env.local --conditions=react-server` (o `--conditions` resolve o
  `server-only`; o `--env-file` carrega o `.env.local`, que o `tsx` nao le sozinho).
- **IA (cabo solto)** — `lib/ai/*`, `app/api/ai/fill` e os componentes `AskAi`/
  `GenerateReport`/`GenerateBriefing` ligados ao runtime, sob `AI_ENABLED`. Sem a
  `ANTHROPIC_API_KEY`, a UI degrada (botoes desabilitados + tooltip).
- **Storage** — `lib/storage/*` (upload/signed-url/list/remove sob RLS da sessao); bucket
  `attachments` privado, path `<uid>/...`. Sem UI de upload ainda (infra pronta).

**Fora do escopo (seguem globais em `process.cwd()`, nao multi-tenant nesta fase — ADR,
Consequencias):** heartbeat (`.businessos/`), leads (`data/leads.json`), agentes
(`.claude/agents`).

**Config de Auth pendente (operacional):** para o **self-service de novos usuarios** sem
SMTP, desabilitar "Confirm email" no dashboard do Supabase (o admin ja e criado com e-mail
confirmado via `service_role`, entao loga sem depender disso).

---

## 12. Estado do view-toggle (grid/lista)

**Fonte de verdade = URL search param `?view=grid|list`**; `localStorage` guarda a
**preferencia** para semear o default entre sessoes. Sem lib de estado.

Por que URL primeiro:

- **Legivel no servidor** (`searchParams` na page RSC) => o modo certo renderiza no
  primeiro paint, sem flash nem layout shift (design system exige skeleton fiel).
- **Compartilhavel/lembravel** e coerente com "a UI e um editor de arquivos" (estado na
  rota, nao escondido em memoria).

Fluxo:

1. Page le `searchParams.view`; se ausente, usa `'grid'` (default do briefing/design
   system) para o SSR.
2. **`view-toggle.tsx`** (client, `Select` do shadcn — um unico controle, design system
   #7.3): `onValueChange` faz `router.replace(`?view=${v}`, { scroll:false })` e grava
   `localStorage['businessos.view'] = v`.
3. Persistencia entre sessoes (R-CARD-05, **P1**): um efeito no client, **quando a URL
   nao traz `view`**, aplica a preferencia salva via `router.replace` (uma vez). Como o
   default `grid` ja e o SSR, o unico reflow possivel e para quem prefere `list` — aceito
   como P1.

```tsx
// components/entities/view-toggle.tsx (client)
'use client';
export function ViewToggle({ value }: { value: 'grid' | 'list' }) {
  const router = useRouter();
  const pathname = usePathname();
  const onChange = (v: 'grid' | 'list') => {
    localStorage.setItem('businessos.view', v);
    router.replace(`${pathname}?view=${v}`, { scroll: false });
  };
  // <Select value={value} onValueChange={onChange}> ... Grade / Lista
}
```

> Alternativa (so `localStorage`, sem URL) rejeitada: exige render client-only da grade
> (flash + perde SSR do conteudo). O par **URL primaria + localStorage de preferencia**
> mantem RSC e ainda lembra a escolha.

---

## 13. Testes

Piramide enxuta, ancorada nos **criterios de aceitacao do PRD §8** (rastreabilidade).

### 13.1 Unit (Vitest) — camadas 3 e 4

- `schema.test.ts`: frontmatter valido/invalido; enums; `id === section/entity` (regra
  do refine); campos por-tipo por entidade.
- `repository.test.ts` (sobre um `FileContentStore` apontando p/ **dir temporario**):
  - round-trip: `writeEntity` -> `readEntity` devolve identico (**CA-05, CA-07**).
  - `updated` muda e `revision` incrementa (**CA-06**); `created`/`id` imutaveis.
  - `ConflictError` quando `baseRevision` desatualizado.
  - `PolicyError` para `agent:*` em `founder_only`; `propose` força `needs_review`.
  - `ValidationError` para `status` fora do enum / campo faltante (**CA-08**).
  - path traversal (`../`) rejeitado.
  - `direcao/oferta` e `validacao/oferta` independentes (**CA-12**).
- `serialize.test.ts`: ordem canonica de chaves estavel (diff limpo).

### 13.2 Componentes (Storybook test) — camada 1

- `@storybook/addon-vitest` roda as stories como testes (play functions) em Chromium
  headless (Playwright provider). Cobre render de card grid/lista, badge por status,
  toggle, estados vazio/loading/erro. a11y via `addon-a11y` por story.

### 13.3 E2E (Playwright) — a tese "ida e volta em arquivo"

Roda contra `next dev`/`next start` com um `CONTENT_ROOT` de fixture temporario:

- **fluxo O1** (**CA-05..CA-07**): abrir `/direcao`, clicar num card, editar campos +
  corpo, salvar, ver toast; ler o arquivo `.md` no disco e conferir frontmatter+corpo;
  recarregar a UI e confirmar que reflete o disco.
- **toggle** (**CA-04**): alternar grid/lista pelo select persiste no reload (URL).
- **validacao** (**CA-08**): salvar com campo obrigatorio vazio bloqueia e mostra erro.
- **agente** (**CA-10**): um teste chama `writeEntity({ editor:'agent:test', ... })` (ou
  a rota PUT), recarrega a UI e confirma render sem quebra + selo "proposto por IA"
  (`needs_review`).

### 13.4 Estatico & CI

- `pnpm typecheck` (`tsc --noEmit`), `pnpm lint` (eslint-config-next), `pnpm content:check`
  (validate-content), `pnpm build`.
- **GitHub Actions** (esboco): matriz -> `install` -> `typecheck` -> `lint` ->
  `content:check` -> `test:unit` -> `build` -> `test:e2e` (Playwright). `content:check`
  garante a metrica de 100% de frontmatter valido (PRD §10.2).

---

## 14. Pacotes & comandos de scaffold (nao-interativos)

> Comandos prontos para copiar. Usam **pnpm** (`pnpm dlx`); para npm troque por
> `npx`/`npm i`, para yarn por `yarn dlx`/`yarn add`. Todos com flags que **evitam
> prompts**. Este doc **especifica** o scaffold; execucao e passo de implementacao.

### 14.1 Criar o app (sem Tailwind — controlamos a versao na 14.2)

```bash
pnpm dlx create-next-app@latest businessos \
  --ts --eslint --app --no-tailwind --no-src-dir \
  --import-alias "@/*" --use-pnpm --no-turbopack --yes
```

Flags: `--ts` TypeScript, `--app` App Router, `--no-src-dir` (app/ na raiz, casa com o
design system), `--import-alias "@/*"`, `--no-tailwind` (instalamos v3 a seguir),
`--no-turbopack` (webpack estavel; opcional), `--yes` aceita defaults restantes.

### 14.2 Tailwind v3 + utilitarios de UI

```bash
cd businessos
pnpm add -D tailwindcss@^3.4 postcss autoprefixer tailwindcss-animate
pnpm dlx tailwindcss init -p    # gera tailwind.config + postcss.config
pnpm add clsx tailwind-merge class-variance-authority lucide-react
```

Depois: substituir `tailwind.config.ts` e `app/globals.css` pelos blocos drop-in de
`03-design-system.md#8.2` e `#2.3`. Adicionar `app/fonts.ts` (Inter) e ligar no
`app/layout.tsx` (`#3.1`).

### 14.3 shadcn/ui (init + add, nao-interativo)

```bash
pnpm dlx shadcn@latest init --base-color neutral --css-variables --yes
pnpm dlx shadcn@latest add --yes \
  button card select badge input textarea label dialog sheet skeleton separator tooltip sonner
```

Conferir que `components.json` ficou `style: new-york`, `baseColor: neutral`,
`cssVariables: true` (secao 8.2). `sonner` provê o `<Toaster/>` do root layout.

### 14.4 Conteudo, validacao e store

```bash
pnpm add gray-matter zod
# lib/content/{schema,registry,entity-extensions,templates,serialize,repository,errors,labels}.ts
# lib/content/store/{types,file-store,index}.ts   (supabase-store.ts fica como stub futuro)
# scripts/{seed-content,validate-content}.ts
```

### 14.5 Storybook (init + addons, nao-interativo)

```bash
pnpm dlx storybook@latest init --yes --no-dev
pnpm dlx storybook@latest add @storybook/addon-a11y
pnpm dlx storybook@latest add @storybook/addon-themes
```

`--no-dev` evita abrir o Storybook ao final. Ajustar `.storybook/preview.tsx` para
importar `app/globals.css` + decorator de tema (secao 9).

### 14.6 Testes

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/jest-dom
pnpm add -D @playwright/test && pnpm dlx playwright install --with-deps chromium
pnpm add -D @storybook/addon-vitest   # roda stories como testes (opcional)
```

### 14.7 Scripts do `package.json`

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "seed": "tsx scripts/seed-content.ts",
    "content:check": "tsx scripts/validate-content.ts",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

(`pnpm add -D tsx` para rodar os scripts TS diretamente.)

### 14.8 Supabase (JA INSTALADO — ADR 0001)

```bash
# Ja instalado e em uso (nao re-rodar):
# pnpm add @supabase/supabase-js @supabase/ssr ai @ai-sdk/anthropic server-only
# lib/content/store/supabase-store.ts implementa ContentStore contra content_entities.
# lib/supabase/{client,server,admin,middleware}.ts + lib/content/{context,session}.ts.
# Migrations em supabase/migrations/ (aplicadas ao projeto). Ver §11 e ADR 0001.
```

---

## 15. Riscos tecnicos & mitigacoes

| # | Risco | Mitigacao |
|---|---|---|
| T1 | `create-next-app`/`shadcn` defaultarem Tailwind v4 e quebrarem os tokens drop-in. | Pin explicito de Tailwind v3 (14.2); `--no-tailwind` no create. Migracao v4 = P2 documentado. |
| T2 | Escrita concorrente founder x agente sobrescreve dados. | Conflito otimista por `revision` + escrita atomica (rename) na camada 3/4; `ConflictError` na UI (R-EDIT-07). |
| T3 | Path traversal via `id` malicioso. | Validacao `section` (enum) + `entity` (`^[a-z0-9-]+$`) e rejeicao de `..` antes do `fs`. |
| T4 | Edge runtime sem `fs`. | `runtime = 'nodejs'` em tudo que toca `lib/content`; nunca importar `fs` em client/edge. |
| T5 | Cache RSC servir conteudo velho apos escrita de agente. | `dynamic = 'force-dynamic'` nas pages de conteudo + `revalidatePath` nas actions. |
| T6 | Windows: CRLF sujando diffs / quebrando parse. | Normalizar CRLF->LF na leitura; escrever sempre LF; `.gitattributes` `*.md text eol=lf`. |
| T7 | Storybook sem `next/font` (fonte some). | Injetar `--font-sans: Inter` local no `preview.tsx`; fixtures ao inves de leitura de `fs`. |
| T8 | Divergencia arquivo <-> registro. | `list` filtra pelo `REGISTRY`; `content:check` no CI; seeder materializa o registro. |

---

## 16. Definition of Done (arquitetura)

- [ ] `app/(app)` com sidebar persistente; `/` redireciona p/ `/founder`.
- [ ] `[section]/page.tsx` unico renderiza as 4 secoes via `generateStaticParams`, lendo
      `listEntities` no servidor (`runtime=nodejs`, `force-dynamic`).
- [ ] Edicao por `[section]/[entity]` (pagina) — modal interceptado opcional.
- [ ] `lib/content` completo: `schema`/`registry`/`serialize`/`repository`/`errors` +
      `context`/`session` + `store/{types,file-store,supabase-store,index}`; UI e agentes
      so acessam por `repository`.
- [ ] `ContentStore` isola a persistencia; `FileContentStore` com escrita atomica;
      `SupabaseContentStore` ativo (RLS + admin) contra `content_entities` (ADR 0001).
- [ ] Contexto de tenant (`AsyncLocalStorage`) via `withUserContext`/`withAdminContext`;
      assinaturas de dominio e call sites inalterados.
- [ ] Auth (Supabase Auth) + `middleware` de refresh/protecao no modo `supabase`.
- [ ] Server Action `saveEntity` com `revalidatePath`, retornando conflito/validacao/policy.
- [ ] View-toggle por URL `?view` + `localStorage` de preferencia; um unico `Select`.
- [ ] Tailwind v3 + tokens/`globals.css`/`tailwind.config.ts` drop-in; Inter via `next/font`.
- [ ] shadcn (new-york/neutral/cssVariables) com os componentes da secao 8.2.
- [ ] Storybook com stories dos primitivos-chave + a11y + tema.
- [ ] `.env.example` + `lib/config.ts` (zod) com vars Supabase/IA; segredos server-only.
- [ ] Testes: unit (repository round-trip/conflito/policy), componentes, e2e (O1);
      `content:check` no CI (100% frontmatter valido).
- [ ] Scaffold reprodutivel pelos comandos nao-interativos da secao 14.

---

## 17. Dependencias a jusante

- **Spec de componentes / Storybook** — implementa `Sidebar`, `EntityCard`(grid/lista),
  `StatusBadge`, `ViewToggle`, `EmptyState`, `EntityForm`/`EditDialog` sobre a estrutura
  e os tokens aqui/no design system.
- **Spec de agentes & skills** — consome `lib/content/repository` (`readEntity`/
  `writeEntity`, `ai_context`, fluxo `propose -> needs_review -> founder aprova`) e,
  opcionalmente, a REST da secao 7.2.
- **Plano de QA** — expande a secao 13 (mapeamento CA-xx -> casos) em suite executavel.
- **Persistencia Supabase multi-tenant (IMPLEMENTADA e verificada — ADR 0001)** —
  `SupabaseContentStore` + contexto de tenant + auth/RLS/storage/IA, sem tocar as camadas
  1–3 (§11). Fiacao ponta a ponta (rotas de auth, ETL, onboarding, CLIs em
  `withAdminContext`, IA) concluida e verificada — ver §11.4.
