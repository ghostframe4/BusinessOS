# BusinessOS

Um "OS de decisao" para founder. Cada entidade do negocio (objetivo, ICP, tese de
valor, oferta, caixa, ...) e um card com **frontmatter estruturado + corpo Markdown**
— a mesma superficie que a UI edita e que agentes de IA leem/escrevem por uma porta
unica (`lib/content/repository.ts`), sempre no fluxo `propose -> needs_review -> founder
aprova`.

Stack: Next.js (App Router) + TypeScript + Tailwind/shadcn-ui + zod. Persistencia em
**Postgres/Supabase multi-tenant** (com fallback local em arquivos). Ver
`docs/04-technical-spec.md` e o **ADR 0001**
(`docs/decisions/0001-persistencia-supabase-multitenant.md`).

## Persistencia: dois modos

Selecionados por `CONTENT_STORE` (`lib/config.ts`):

- **`file`** (default) — as 11 entidades vivem como arquivos MD em `content/`. Nao
  exige Supabase nem login. Ideal para dev, testes e rollback.
- **`supabase`** — Postgres/Supabase, **multi-tenant**: cada usuario tem a sua copia
  das entidades, isolada por RLS (`auth.uid()`), com **autenticacao** (Supabase Auth).
  Modo de producao.

A **forma** do conteudo (schema, `REGISTRY`, templates, frontmatter) e identica nos dois
modos — muda so a camada de armazenamento por tras da interface `ContentStore`.

## Setup

### 1. Dependencias

```bash
pnpm install
```

### 2. Ambiente

```bash
cp .env.example .env.local
```

Preencha `.env.local` (ver comentarios no `.env.example`). Para comecar rapido em
**modo file**, basta `CONTENT_STORE=file` — nenhuma chave Supabase e necessaria.

### 3. Rodar (modo file)

```bash
pnpm seed        # cria os 11 arquivos MD ausentes a partir do REGISTRY (idempotente)
pnpm dev         # http://localhost:3000
```

### 4. Rodar (modo supabase)

1. Crie um projeto no [Supabase](https://supabase.com) e pegue as chaves em
   **Project Settings > API**.
2. Preencha em `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e
   `CONTENT_STORE=supabase`.
3. Aplique as migrations de `supabase/migrations/` ao projeto (via Supabase CLI ou o
   painel SQL). Elas criam `profiles`, `content_entities` (com RLS de isolamento por
   tenant), o trigger de provisionamento de profile no signup e o bucket privado
   `attachments`.
4. `pnpm dev`. Com auth ligada, rotas de app exigem sessao; o founder
   (`FOUNDER_EMAIL`) entra como `admin`, demais usuarios como `member` com os cards
   vazios.

> **IA (opcional):** definir `ANTHROPIC_API_KEY` liga a IA no runtime (`AI_ENABLED`).
> Sem a chave, as acoes de IA ficam desabilitadas — o resto do app funciona normalmente.

## Comandos uteis

```bash
pnpm dev             # servidor de desenvolvimento
pnpm build           # build de producao
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint
pnpm seed            # semeia content/ (modo file)
pnpm content:check   # valida todo o content/
pnpm agent:read      # CLI de leitura para agentes (ver AGENTS.md / CLAUDE.md)
pnpm agent:write     # CLI de escrita (proposta) para agentes
```

## Documentacao

- `CLAUDE.md` — guia para agentes (porta unica, alcada, fluxo de proposta).
- `AGENTS.md` — registro de agentes/skills e suas alcadas.
- `docs/02-content-model.md` — modelo de conteudo (frontmatter + schema).
- `docs/04-technical-spec.md` — arquitetura, camadas e stack.
- `docs/decisions/0001-persistencia-supabase-multitenant.md` — ADR da persistencia
  Supabase multi-tenant.
