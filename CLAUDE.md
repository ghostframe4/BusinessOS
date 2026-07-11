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
Next.js App Router + TS, Tailwind + shadcn/ui, Inter, P&B minimalista. Sem banco:
persistencia = arquivos MD locais em content/. Supabase e futuro (nao implementar).
