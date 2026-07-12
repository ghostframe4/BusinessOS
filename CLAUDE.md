# BusinessOS — Guia para agentes (CLAUDE.md)

## O que e este repo
BusinessOS: um "OS de decisao" para founder. Cada entidade do negocio e um arquivo
Markdown com frontmatter YAML em `content/<section>/<entity>.md`. Esses arquivos sao,
ao mesmo tempo, o que a UI edita e o contexto compartilhado que voce (agente) le/escreve.

## Regra de ouro
NUNCA edite arquivos em `content/` diretamente (nem via filesystem/echo/patch de texto/
`Edit`). SEMPRE use os CLIs, que sao a porta unica e embrulham `lib/content/repository.ts`
(herdando validacao, politica de escrita, deteccao de conflito e escrita atomica):
  - `pnpm agent:read --id <section/entity>` -> JSON `{ frontmatter, body }` (pegue
    `revision`, `status`, `ai_context`).
  - `pnpm agent:read --section <s>` (ou sem args) -> lista de EntityMeta.
  - `pnpm agent:write --id <id> --editor agent:<slug> --base-revision <n>
    [--summary ... --tags a,b --set k=v --body-file <tmp>]` -> propoe a escrita.
Rode-os via Bash. NUNCA chame o filesystem cru; a UI usa `readEntity`/`writeEntity`
por baixo — voce usa os CLIs por cima.

A porta unica NAO mudou de assinatura com a migracao para Supabase (ADR 0001): quem
resolve o tenant e o CONTEXTO de execucao (AsyncLocalStorage), estabelecido nos pontos
de entrada. No modo `supabase`, os CLIs/ETL/onboarding operam via `withAdminContext`,
agindo no tenant do **admin** (o founder) com `service_role` (contorna a RLS). No modo
`file` (padrao de dev/testes), operam direto sobre `content/`, sem contexto.

### Atividade ao vivo no Workflow
Cada `agent:read`/`agent:write` deixa um batimento efemero (~10s) que o board de
Workflow mostra em "TRABALHANDO AGORA". Em `agent:write` o ator vem do `--editor`.
Em `agent:read` o ator e, por padrao, o agente DONO da entidade lida; ao ler uma
entidade de OUTRA alcada como contexto, prefixe com `BUSINESSOS_ACTOR=agent:<seu-slug>`
para aparecer com o seu nome (ex.: `BUSINESSOS_ACTOR=agent:icp pnpm agent:read --id founder/objetivo`).

O heartbeat de atividade segue **global** em `.businessos/` (nao e multi-tenant nesta
fase — ver ADR 0001, "Consequencias"). Ele reflete a operacao dos CLIs, que rodam no
tenant do admin.

## Antes de propor qualquer mudanca
1. `pnpm agent:read --id <alvo>` e leia `frontmatter.ai_context` (purpose, read_when,
   related, write_policy, instructions).
2. Se `write_policy === 'founder_only'` -> voce SO LE. Nao escreva (um `agent:write`
   retorna `ok:false, kind:'policy'`).
3. Monte contexto lendo os ids em `ai_context.related` (profundidade 1) com mais
   `pnpm agent:read --id <related>`.
4. Guarde o `frontmatter.revision` lido como `--base-revision`.
5. Se `status` ja === 'needs_review', existe proposta pendente: NAO empilhe outra.

## Ao escrever
- `--editor` SEMPRE `agent:<seu-slug>`. Nunca 'founder' nem 'system'.
- Nao defina campos de sistema (id, section, entity, created, revision, updated,
  last_edited_by, schema_version) — o repositorio controla e ignora patch neles.
- Sob write_policy 'propose', sua escrita vira status 'needs_review' automaticamente.
  Nao tente forcar 'validated'.
- Preserve os headings do template da entidade e o H1 igual ao `title` (grave o corpo
  novo num arquivo temporario e passe em `--body-file`).
- Se a resposta vier `ok:false, kind:'conflict'`: re-leia com `pnpm agent:read`
  (novo `currentRevision`) e reconcilie; nunca reenvie cego.

## Alcada
Escreva apenas nas entidades da sua alcada (ver AGENTS.md). Escrita cross-section e
proibida — leia de outras secoes para contexto, mas so proponha na sua.

## O founder aprova
Voce PROPOE; o founder DISPOE na UI. Nao ha execucao autonoma "final".

## Stack (nao re-litigar)
Next.js App Router + TS, Tailwind + shadcn/ui, Inter, P&B minimalista.

Persistencia de PRODUCAO: **Postgres/Supabase**, **multi-tenant** — cada usuario tem a
sua copia das 11 entidades, isolada por **RLS** (`auth.uid()`), com **autenticacao**
(Supabase Auth, email+senha). A FORMA do conteudo NAO mudou (schema zod, `REGISTRY`,
templates, frontmatter YAML); o que mudou foi a **camada de persistencia** — agora a
tabela `content_entities` (uma linha por entidade por usuario), no lugar dos arquivos.
O modo **`file`** (arquivos MD em `content/`) continua para **dev/testes/rollback**,
selecionado por `CONTENT_STORE=file|supabase`. Os arquivos em `content/` seguem no repo
como semente historica do admin (fonte do ETL). Ver **ADR 0001**
(`docs/decisions/0001-persistencia-supabase-multitenant.md`) e `docs/04-technical-spec.md`.

Plataforma que veio junto (ver ADR): **storage** privado de anexos (bucket `attachments`,
infra + policies prontas, sem UI ainda) e **IA integrada** por "cabo solto" — liga
sozinha quando `ANTHROPIC_API_KEY` existe (`AI_ENABLED`); sem a chave, a UI degrada com
elegancia. A IA, quando ligada, escreve pela **mesma porta** (`repository` /
`propose -> needs_review`), nunca contornando a politica.
