---
adr: 0001
title: Persistencia em Supabase + multiusuario (fim do Markdown como fonte)
status: aceito
data: 2026-07-12
owner: ruanbraz@overlens.com.br
substitui: docs/04-technical-spec.md §11 (plano "Supabase futuro, single-tenant")
tags: [arquitetura, persistencia, supabase, postgres, auth, multi-tenant, rls, storage, ia]
---

# ADR 0001 — Persistencia em Supabase + multiusuario

## Status

**Aceito** (2026-07-12). Expande e substitui o "plano futuro" de `docs/04 §11`, que
previa Supabase como troca de camada 4 **single-tenant e sem auth**. Esta decisao torna
o produto **multiusuario com autenticacao**.

## Contexto

O BusinessOS nasceu como um "OS de decisao" para **um** founder, com persistencia em
arquivos Markdown (`content/<section>/<entity>.md`) — a "fonte unica". A arquitetura foi
deliberadamente desenhada em 4 camadas com uma **fronteira dura** na interface
`ContentStore` (camada 4), justamente para permitir trocar arquivos por banco **sem
tocar** as regras de dominio (camada 3, `repository.ts`) nem a UI (camada 1). O stub
`lib/content/store/supabase-store.ts` e o switch `CONTENT_STORE=file|supabase` ja
existiam como preparo.

Mudou o produto: queremos que **varios usuarios** usem o sistema, cada um com o seu
proprio conjunto das 11 entidades. Isso exige tres coisas que o desenho single-tenant
nao tinha: **(a)** persistencia compartilhavel e concorrente (banco, nao arquivos no
disco de um processo), **(b)** **autenticacao** e isolamento por usuario, **(c)** um
**usuario admin** semente (o founder) que carrega o conteudo real de hoje, enquanto
**novos usuarios** entram com os cards vazios — para preencher a mao ou **com a ajuda da
IA**. Somam-se dois requisitos de plataforma: **IA integrada** no runtime (hoje a "IA" e
offline — a UI so monta comandos para colar no Claude Code) e **storage** para anexos
(imagens, PDF, txt, docs) que virao em breve.

## Decisao

### 1. Postgres (Supabase) passa a ser a fonte de verdade

`CONTENT_STORE=supabase` vira o modo de producao. Implementamos
`SupabaseContentStore implements ContentStore` contra a tabela `content_entities`. O
modo `file` (`FileContentStore`) **permanece** para desenvolvimento, testes e rollback —
a fronteira `ContentStore` continua sendo o unico ponto de troca. Os arquivos em
`content/` deixam de ser a fonte, mas sao **preservados no repo** como semente historica
do admin (fonte da migracao ETL).

### 2. Multi-tenant por linha, isolado com RLS

`content_entities` ganha `user_id uuid` (FK `auth.users`). **PK composta
`(user_id, entity_id)`** — cada usuario tem a sua copia das 11 entidades. O isolamento e
garantido por **Row Level Security**: toda policy filtra por `auth.uid()`. O
`service_role` (server-side) contorna a RLS para operacoes administrativas (seed, ETL,
agentes de CLI).

### 3. Contexto de tenant via `AsyncLocalStorage` — assinaturas de dominio intactas

Decisao-chave de baixo impacto: **nao** adicionamos `userId` as assinaturas de
`readEntity`/`writeEntity`/`listEntities`. Em vez disso, um `AsyncLocalStorage`
(`lib/content/context.ts`) carrega o **contexto de execucao** `{ store, actorEmail }`. Os
**pontos de entrada** estabelecem o contexto uma vez; o `getStore()` interno o le:

- **UI (RSC / Server Actions / Route Handlers):** resolvem o usuario logado via
  `@supabase/ssr` (cookies) e rodam o corpo dentro de `runWithContext(...)`. A RLS filtra
  por sessao — o store nem precisa do `userId` explicito.
- **CLIs / agentes (`agent:read`/`agent:write`, `tsx`):** nao tem sessao HTTP. Rodam com
  `service_role` + um `actAsUserId` **explicito** (o admin), estabelecido no `main()`.

Consequencia: os **11 call sites** de repositorio e toda a UI **nao mudam de assinatura**.
Muda `getStore()` (deixa de ser singleton global; passa a resolver do contexto) e
`buildSeedFrontmatter` (o `owner` vem do contexto, nao mais fixo em `FOUNDER_EMAIL`).

### 4. Autenticacao: Supabase Auth (email + senha)

Auth do zero (nao existia nada). `@supabase/ssr` + `middleware.ts` para refresh de sessao
e protecao de rotas. Uma tabela `profiles` (1:1 com `auth.users`) carrega `role`
(`admin` | `member`). **Signup self-service** habilitado: qualquer novo usuario cria
conta e recebe o sistema com os cards **vazios**.

### 5. Admin semente + onboarding de novos usuarios

- **Admin:** o founder (`ruanbraz@overlens.com.br`, `role=admin`). Um script de **ETL**
  le `content/**/*.md` via `FileContentStore` e grava no Supabase sob o `user_id` do
  admin — levando o conteudo real de hoje para o banco.
- **Novos usuarios:** um trigger SQL cria o `profiles` no signup; o **seed das 11
  entidades vazias** roda em TS (reusa `REGISTRY` + `buildSeedFrontmatter`) no primeiro
  acesso/onboarding — evita duplicar o registro canonico em SQL.

### 6. IA integrada com "cabos soltos"

Preparamos toda a integracao de IA (rota/Server Action, provider via **Vercel AI SDK +
`@ai-sdk/anthropic`**, ligacao dos componentes `AskAi`/`GenerateReport`/`GenerateBriefing`
ao runtime) atras de um **feature-flag por presenca de chave** (`AI_ENABLED` = existe
`ANTHROPIC_API_KEY`?). Sem a chave, a UI degrada com elegancia (botoes desabilitados +
tooltip "IA nao configurada"). Quando o founder colar a chave, **nada mais precisa ser
codado** — so reiniciar. A IA escreve pela **mesma porta** (`repository`/`propose ->
needs_review`); nunca contorna a politica.

### 7. Storage para anexos (infra pronta, sem UI ainda)

Bucket **privado** no Supabase Storage (`attachments`) com policies RLS por usuario
(prefixo de caminho `=<auth.uid()>/...`). Helpers server-side de upload/download/URL
assinada + validacao de tipo (imagem, PDF, txt, docx). **Nenhum botao** de upload nesta
fase — a infra fica pronta para o recurso que vem em breve.

## Consequencias

**Positivas**
- Multiusuario real com isolamento forte (RLS) e concorrencia segura (lock otimista por
  `revision` vira `UPDATE ... WHERE revision = base` — 0 linhas => `ConflictError`,
  semantica identica a do rename atomico do file-store).
- Camadas 1–3 e os 11 call sites **inalterados** (gracas ao `AsyncLocalStorage`).
- IA e storage entram como plataforma, nao como giria — com desligamento gracioso.

**Custos / riscos**
- Introduz auth, RLS e um contexto assincrono — mais superficie para testar. Mitigacao:
  testes de store (file + supabase), teste de isolamento entre tenants, e2e de login.
- Heartbeat de atividade (`.businessos/`), `leads` (`data/leads.json`) e agentes
  (`.claude/agents`) seguem **globais em `process.cwd()`** — fora do escopo deste ADR;
  ficam single-tenant/globais por ora (a migracao deles e trabalho futuro, anotado).
- Pre-render estatico das paginas de secao (`generateStaticParams`) e incompativel com
  dados por-usuario: as paginas passam a ser dinamicas por sessao.
- Dependencia operacional de um servico externo (Supabase) — o modo `file` continua como
  rota de fuga para dev/local/rollback.

## Alternativas consideradas

1. **`userId` explicito em toda assinatura de dominio** — rejeitado: exigiria mudar os 11
   call sites + interface do store + toda a UI, sem ganho sobre o `AsyncLocalStorage`.
2. **Um schema Postgres por tenant** — rejeitado: complexidade operacional
   desproporcional para o estagio; RLS por linha resolve o isolamento.
3. **Trigger SQL que semeia as 11 entidades no signup** — rejeitado: duplicaria o
   `REGISTRY` (fonte canonica em TS) em SQL, propenso a divergir. Seed em TS no
   onboarding e DRY.
4. **NoSQL / documento** — rejeitado: o frontmatter ja e relacional-amigavel e queremos
   RLS, joins com `profiles` e transacoes; Postgres e o encaixe natural.
5. **Continuar em Markdown + camada de sync** — rejeitado: nao resolve concorrencia
   multiusuario nem isolamento; arquivos no disco de um processo nao escalam para contas.
