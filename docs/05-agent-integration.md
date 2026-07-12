---
doc: agent-integration
title: Integracao de Agentes & Skills
status: derivado
deriva_de: 00-briefing
versao: 1.0.0
owner: ruanbraz@overlens.com.br
atualizado_em: 2026-07-11
depende_de: [docs/00-briefing.md, docs/01-prd.md, docs/02-content-model.md, docs/03-design-system.md]
tags: [agentes, skills, mcp, claude-code, contexto-compartilhado, guardrails, frontmatter]
---

# BusinessOS — Integracao de Agentes & Skills

> **A camada de colaboracao humano+IA.** Este documento especifica **como agentes de
> IA e skills colaboram com o founder atraves da camada de contexto Markdown** —
> os mesmos arquivos `content/<section>/<entity>.md` que a UI edita. O contrato de
> forma (frontmatter, `ai_context`, `write_policy`, `revision`, fluxo
> `propose -> needs_review -> founder aprova`) e fixado em `docs/02-content-model.md`;
> **este doc nao redefine esse contrato — ele especifica o comportamento dos agentes
> em cima dele**. Em conflito de visao/escopo, o briefing (`docs/00-briefing.md`)
> prevalece; em conflito de forma de arquivo, o modelo de conteudo prevalece.

Persona de referencia: **Agente/Skill como usuario de primeira classe** (PRD secao
3.2). Requisito guia: **R-AG-01..06** (PRD 5.5). Tudo aqui e implementavel com
**subagentes e skills do Claude Code** rodando localmente sobre o filesystem — sem
banco, sem servico proprietario.

---

## 1. Principios da integracao

1. **O arquivo e a interface.** Nao ha API de agente separada. O contexto compartilhado
   sao os arquivos MD em `content/`. Um agente que sabe ler/escrever um `.md` valido
   ja participa do sistema (R-AG-01, R-AG-02, R-AG-03).
2. **Frontmatter e o estado legivel por maquina.** O corpo e para humano+maquina; o
   frontmatter (`status`, `updated`, `revision`, `ai_context`, campos por-tipo) e o
   estado estruturado que o agente le para decidir e escreve para reportar.
3. **O founder sempre aprova o "final".** Agente **propoe**, humano **dispoe**. Nenhuma
   escrita de agente vira estado terminal sem passar por `needs_review` e aprovacao na
   UI (R-AG-04, content-model 10.4).
4. **Nunca sobrescrever silenciosamente.** Concorrencia founder x agente e resolvida por
   `revision` (conflito otimista) + politica de escrita por entidade. Ver secao 5.
5. **Uma unica porta de acesso.** Agentes NAO leem/escrevem o filesystem de conteudo
   "na mao": usam o mesmo `lib/content/repository.ts` (`readEntity`/`writeEntity`) que a
   UI. Isso garante validacao, ordenacao de chaves, escrita atomica e enforcement de
   politica identicos (content-model 10).
6. **Auditavel por construcao.** Toda escrita de agente e um diff de texto em git com
   `last_edited_by: agent:<slug>` — rastreavel sem ferramenta especial (R-AG-05).
7. **Menor privilegio.** Cada agente le/escreve apenas as entidades da sua alcada; a
   fronteira e declarada em `ai_context` + na config da skill, nao no codigo do agente.

---

## 2. O protocolo de contexto compartilhado

### 2.1 O ciclo canonico (ler -> raciocinar -> propor -> revisar)

```
            ┌───────────────────────── content/ (fonte unica) ─────────────────────────┐
            │                                                                           │
  (1) READ  │   readEntity(id)  ──►  { frontmatter, body }                              │
            │        ▲  usa ai_context.related p/ montar contexto vizinho               │
            │        │                                                                  │
  (2) THINK │   agente raciocina sobre frontmatter (estado) + corpo (narrativa)         │
            │        │                                                                  │
  (3) WRITE │   writeEntity({ editor:'agent:<slug>', baseRevision, patch, body })       │
            │        │  repo aplica: conflito? politica? -> status=needs_review         │
            │        ▼                                                                  │
  (4) REVIEW│   UI mostra card "Proposto por IA" -> founder aprova/edita/rejeita        │
            │        │  founder faz writeEntity({ editor:'founder', status:'validated' })│
            └────────┴──────────────────────────────────────────────────────────────────┘
```

- **(1) Ler** e sempre via `readEntity`. Para montar contexto o agente segue
  `frontmatter.ai_context.related` (ids de entidades vizinhas) e `read_when` (quando
  aquela entidade e relevante). Isso torna o roteamento **declarativo**: o agente nao
  hardcoda quais arquivos ler — ele os descobre no proprio frontmatter.
- **(2) Raciocinar**: o agente combina o **estado** (frontmatter) com a **narrativa**
  (corpo) das entidades lidas. `ai_context.instructions` restringe tom/limites por
  entidade (ex.: "nao invente segmentos fora do ICP").
- **(3) Escrever** e sempre via `writeEntity`, passando `baseRevision` (o `revision`
  que o agente leu) e `editor: 'agent:<slug>'`. O repositorio decide o resto (secao 5).
- **(4) Revisar**: a proposta chega como `status: needs_review`. O founder aprova pela
  UI (novo `writeEntity` com `editor: 'founder'`), rejeita, ou edita antes de aprovar.

### 2.2 O frontmatter como estado legivel por maquina

O agente NAO precisa "adivinhar" o estado do negocio — ele o le no frontmatter:

| Campo lido | O que o agente infere |
|---|---|
| `status` | Maturidade da entidade (`empty` = precisa seed; `needs_review` = ja ha proposta pendente, nao propor de novo). |
| `updated` / `revision` | Frescor do contexto; `baseRevision` para escrita segura. |
| `summary` | TL;DR barato para montar contexto sem carregar o corpo inteiro. |
| `ai_context.purpose` | Para que a entidade serve, em termos de agente. |
| `ai_context.read_when` | Se deve ler esta entidade para a tarefa atual. |
| `ai_context.related` | Quais vizinhas puxar para contexto. |
| `ai_context.write_policy` | Se pode escrever aqui (`founder_only` = so leitura). |
| `ai_context.instructions` | Limites especificos de conteudo. |
| campos por-tipo | Sinais quantitativos (ex.: `confidence`, `runway_months`, `paying_count`). |

O agente **escreve de volta** no frontmatter apenas o que lhe cabe (secao 5.3): campos
de conteudo e `status` (sujeito a politica). Campos de sistema (`revision`, `updated`,
`last_edited_by`, `id`, `created`, `schema_version`) sao controlados pelo repositorio —
o agente nunca os define.

### 2.3 Contexto de leitura minimo (montagem barata)

Para uma tarefa, o agente monta contexto em camadas, do mais barato ao mais caro:

1. `listEntities(section)` -> so `EntityMeta` (title, status, summary, updated). Barato.
2. `readEntity(alvo)` -> frontmatter + corpo do arquivo-alvo.
3. Para cada id em `alvo.ai_context.related`: `readEntity(id)` -> contexto vizinho.
4. (Opcional) subir uma "camada" seguindo o `related` dos vizinhos, com **limite de
   profundidade 1** por padrao para nao puxar o repositorio inteiro.

Regra: **nunca carregar todos os 11 arquivos "por seguranca"**. O grafo `related` +
`read_when` existe justamente para manter o contexto pequeno e pertinente.

---

## 3. Papeis de agente mapeados as secoes

Cada agente e um **subagente/skill do Claude Code** com um `slug` estavel (vira
`last_edited_by: agent:<slug>`). A alcada (entidades que le/escreve) espelha as secoes
do PRD e do registro canonico (content-model 8.1). Slugs sao kebab-case
(`^agent:[a-z0-9-]+$`, content-model 6.4).

### 3.1 Tabela de agentes propostos

| Agente (`slug`) | Secao | Le (contexto) | Propoe escrita em | Papel resumido |
|---|---|---|---|---|
| `agent:founder-coach` | founder | `founder/*` | `founder/objetivo` | Ajuda a articular objetivo e horizonte. **Nao** escreve `estilo-de-vida` (`founder_only`). |
| `agent:market-map` | direcao | `direcao/mapa-do-mercado`, `direcao/ima-de-problemas` | `direcao/mapa-do-mercado` | Estrutura territorio, players, tendencias, onde jogar. |
| `agent:problem-magnet` | direcao | `direcao/ima-de-problemas`, `founder/*`, `direcao/mapa-do-mercado` | `direcao/ima-de-problemas` | Lista/prioriza problemas que valem resolver, ancorados no founder. |
| `agent:icp` | direcao | `direcao/perfil-ideal-de-cliente`, `direcao/ima-de-problemas`, `direcao/mapa-do-mercado` | `direcao/perfil-ideal-de-cliente` | Define ICP: quem, contexto, dores, onde achar, anti-perfil. |
| `agent:value-thesis` | direcao | `direcao/tese-de-valor` + `related` (`icp`, `ima-de-problemas`) | `direcao/tese-de-valor` | Formula a hipotese de valor a partir de ICP + dores. |
| `agent:offer-strategist` | direcao | `direcao/oferta`, `direcao/tese-de-valor` | `direcao/oferta` (tese) | Traduz tese de valor em oferta estrategica (promessa, formato, preco-hipotese). |
| `agent:validation-synth` | validacao | `validacao/primeiros-clientes`, `validacao/oferta`, `direcao/perfil-ideal-de-cliente` | `validacao/oferta`, `validacao/primeiros-clientes` | Sintetiza aprendizado de campo e sugere ajuste da oferta validada; fecha o loop tese->evidencia. |
| `agent:cash-flow` | caixa | `caixa/fluxo-de-caixa` | `caixa/fluxo-de-caixa` | Resume o mes, calcula saldo/runway, projeta premissas. **Nao** lanca transacoes. |

Observacoes importantes:

- **`caixa/erp` e `founder/estilo-de-vida` sao `founder_only`** (content-model 8.1):
  nenhum agente escreve neles — apenas leem para contexto. Isso e enforced pelo
  repositorio (secao 5.2), nao pela boa-vontade do agente.
- **Oferta duplicada (R-OFERTA).** `agent:offer-strategist` escreve so em
  `direcao/oferta`; `agent:validation-synth` escreve so em `validacao/oferta`. Nunca ha
  sincronizacao automatica entre os dois arquivos — um agente pode **relacionar** (ler
  ambos) mas cada `writeEntity` atinge um unico arquivo.
- **Cross-section e leitura, nao escrita.** Um agente de `direcao` pode **ler**
  `founder/*` para calibrar, mas so **escreve** dentro da propria secao. Escrita
  cross-section exige outro agente com alcada naquela secao.

### 3.2 Agentes utilitarios (transversais, opcionais)

| Agente (`slug`) | Papel | Escreve? |
|---|---|---|
| `agent:seed-assistant` | Preenche o primeiro rascunho de uma entidade `status: empty` a partir de uma conversa curta com o founder (resolve o gargalo de onboarding citado em `validacao/primeiros-clientes`). | Sim, sempre como `needs_review`. |
| `agent:context-linter` | Valida frontmatter, coerencia `id`<->caminho, headings do template, links `related` quebrados. So relata — nao corrige sozinho. | Nao (read-only; emite relatorio). |
| `agent:summarizer` | Regera `summary` (1–2 frases) quando o corpo mudou muito e o `summary` ficou desatualizado. | Sim (patch so em `summary`), `propose`. |

Estes sao **skills** finas: uma responsabilidade, um contrato claro. Nao inventar um
"super-agente" que faz tudo — a alcada estreita e o que mantem os guardrails simples.

### 3.3 Mapa visual agente <-> entidade

```
founder/       objetivo ─────────────◄─ agent:founder-coach   (escreve)
               estilo-de-vida ───────◄─ (todos: SO LEITURA — founder_only)

direcao/       mapa-do-mercado ──────◄─ agent:market-map
               ima-de-problemas ─────◄─ agent:problem-magnet
               perfil-ideal-de-cliente ◄ agent:icp
               tese-de-valor ────────◄─ agent:value-thesis
               oferta (tese) ────────◄─ agent:offer-strategist

validacao/     oferta (validada) ────◄─ agent:validation-synth
               primeiros-clientes ───◄─ agent:validation-synth

caixa/         fluxo-de-caixa ───────◄─ agent:cash-flow
               erp ──────────────────◄─ (todos: SO LEITURA — founder_only)

transversais:  agent:seed-assistant · agent:context-linter · agent:summarizer
```

---

## 4. Como os agentes sao invocados

Tres formas, todas implementaveis com Claude Code. Todas terminam no mesmo lugar:
`readEntity`/`writeEntity`.

### 4.1 Invocacao por skill do Claude Code (modo primario)

Cada agente e uma **skill** (subagente) definida no repo, sob `.claude/agents/` (ou
`.claude/skills/`, conforme a convencao do repo — secao 7). O founder invoca:

- **Pela CLI do Claude Code**, em linguagem natural: *"proponha uma tese de valor a
  partir do ICP e dos problemas"* -> o roteador do Claude Code seleciona
  `agent:value-thesis` (pela descricao/trigger da skill).
- **Por comando explicito**, ex.: `/value-thesis` (se a skill expuser um slash).
- **Encadeado** por outro agente (ex.: `agent:icp` sugere, ao terminar, rodar
  `agent:value-thesis` — mas quem confirma a cadeia e o founder).

O roteamento e guiado por `ai_context.read_when` das entidades e pela `description` da
skill. Nada de agente rodando sozinho em background no MVP.

### 4.2 Invocacao a partir da UI (superficie de acao)

A UI pode oferecer, no card/formulario de uma entidade, um botao **"Pedir a IA"** que
dispara o agente da alcada daquela entidade. Como o produto e local e sem execucao
autonoma:

- No MVP, o botao **abre a instrucao pronta** (deep-link/comando) para o founder rodar
  no Claude Code, OU chama um Route Handler local que executa a skill e grava via
  `writeEntity`. Em ambos os casos o resultado entra como `needs_review`.
- A UI entao mostra o card com selo **"Proposto por IA"** (derivado de
  `status === 'needs_review'` + `last_edited_by` comecando com `agent:`), conforme
  design-system 7.2 / content-model 11.

### 4.3 Invocacao programatica (seed/manutencao)

`agent:seed-assistant`, `agent:context-linter` e `agent:summarizer` podem ser rodados
como scripts locais (ex.: `npm run agent:lint`) que usam o `repository.ts`. Continuam
sujeitos as mesmas politicas — um script tambem escreve como `agent:<slug>` e cai em
`needs_review` sob `propose`.

> **Nao-objetivo (PRD 2.2):** sem execucao autonoma sem revisao, sem agendamento
> recorrente escrevendo direto no `content/` sem passar por `needs_review`. Cron/loop
> podem **sugerir**, nunca **finalizar**.

---

## 5. Regras e guardrails de leitura/escrita

Os guardrails NAO dependem do bom comportamento do prompt do agente — eles sao
**enforced pelo `repository.ts`** (content-model 10.4). O prompt do agente os repete
para bom senso, mas a barreira real e o codigo.

### 5.1 Guardrail 1 — Nunca sobrescrever edicao do founder (conflito otimista)

- Todo agente carrega o `revision` que leu (`baseRevision`) e o passa para
  `writeEntity`.
- Se, no momento da escrita, `revision` no disco != `baseRevision` (o founder ou outro
  agente escreveu no intervalo), `writeEntity` lanca **`ConflictError`**. A escrita NAO
  acontece.
- **Comportamento obrigatorio do agente ao receber `ConflictError`:** re-ler
  (`readEntity`), reconciliar com o novo estado e so entao tentar de novo — nunca
  reenviar cegamente o mesmo patch. Se o novo estado ja resolve a tarefa, o agente
  **desiste** e informa.

### 5.2 Guardrail 2 — Politica de escrita por entidade (`write_policy`)

Consultada em `ai_context.write_policy` (content-model 6.3):

| `write_policy` | Efeito para um `editor: agent:*` |
|---|---|
| `founder_only` | `writeEntity` lanca **`PolicyError`**. Agente **so le**. (Ex.: `estilo-de-vida`, `erp`.) |
| `propose` (default) | Escrita aceita, mas o repo **força `status: needs_review`**. Precisa aprovacao. |
| `open` | Escrita aceita com o status do conteudo (usar com parcimonia; nenhuma entidade do seed usa `open`). |

O agente NAO pode elevar a propria permissao: a politica vive no arquivo/registro, e o
repositorio a le do disco, nao do input do agente.

### 5.3 Guardrail 3 — Campos de sistema sao intocaveis

O agente **nunca** define diretamente: `id`, `section`, `entity`, `created`,
`revision`, `updated`, `last_edited_by`, `schema_version`. Se vierem no patch, o
repositorio **ignora/rejeita** (content-model 10.4 passo 6 e 13.13). O agente controla
apenas: `title`, `summary`, `tags`, `order`, `status` (sujeito a politica), `ai_context`
(com cautela — ver 5.4), corpo, e campos por-tipo da entidade.

### 5.4 Guardrail 4 — `ai_context` e quase-imutavel para agentes

`ai_context` e o **contrato**; deixar um agente reescrever livremente o proprio contrato
e um risco. Regra:

- Agente **nao altera** `write_policy` nem `purpose` (mudanca de contrato = decisao do
  founder).
- Agente **pode sugerir** adicionar `related`/`read_when` faltantes, mas isso entra como
  proposta em `needs_review` como qualquer outra mudanca — nunca aplicada em modo
  silencioso.

### 5.5 Guardrail 5 — Validez de forma (o resultado precisa renderizar na UI)

Toda escrita passa por `frontmatterSchema` + extensao por-tipo (Zod). Se o agente
produzir frontmatter invalido, `writeEntity` lanca **`ValidationError`** e nada e
gravado (R-AG-03 exige que a UI renderize a mudanca sem quebrar). O agente deve
**preservar os headings do template** da entidade (content-model 8.3) e manter o H1
igual ao `title`.

### 5.6 Guardrail 6 — Escopo/alcada

- `id` fora do `REGISTRY` -> `NotInRegistryError`. Agente nao cria entidades novas fora
  do registro canonico.
- Agente escreve apenas nas entidades da sua alcada (secao 3). Tarefa que exige escrever
  fora da alcada e recusada com uma mensagem clara ("isto pertence a `agent:<outro>`").

### 5.7 Guardrail 7 — Idempotencia e "nao repropor"

Antes de propor, o agente **le o `status`**: se ja esta `needs_review` (ha proposta
pendente), o agente NAO empilha outra proposta — ele informa que existe uma revisao
aguardando o founder. Evita enxurrada de propostas concorrentes sobre o mesmo arquivo.

### 5.8 Resumo dos erros do contrato (o agente deve saber tratar)

| Erro (`repository.ts`) | Causa | Reacao esperada do agente |
|---|---|---|
| `ConflictError` | `revision` mudou desde a leitura | Re-ler, reconciliar, talvez desistir. |
| `PolicyError` | `write_policy: founder_only` | Nao escrever; so ler e relatar. |
| `ValidationError` | frontmatter/corpo invalido | Corrigir a forma e tentar de novo. |
| `NotInRegistryError` | `id` fora do registro | Recusar; fora de alcada. |

---

## 6. Fronteiras MCP / skill

Delimita o que e **skill** (logica de negocio do agente) versus o que e **MCP**
(acesso a recurso) versus o que e **repository** (a porta de conteudo).

### 6.1 Camadas

```
┌──────────────────────────────────────────────────────────────┐
│  SKILL (subagente Claude Code)                                 │
│  - prompt/instrucoes do papel (ex.: agent:value-thesis)        │
│  - decide O QUE ler e O QUE propor                             │
│  - NUNCA toca o filesystem direto                             │
└───────────────┬───────────────────────────────┬───────────────┘
                │ chama                          │ (opcional)
                ▼                                ▼
┌───────────────────────────────┐   ┌───────────────────────────┐
│  repository.ts (porta unica)   │   │  MCP servers (recursos)    │
│  readEntity / writeEntity /    │   │  - filesystem MCP (ler/    │
│  listEntities                  │   │    escrever content/ SE    │
│  - valida, aplica politica,    │   │    exposto como MCP)       │
│    conflito, escrita atomica   │   │  - git MCP (historico/diff)│
└───────────────┬───────────────┘   │  - web/search (pesquisa    │
                ▼                    │    de mercado p/ market-map)│
        content/*.md (git)          │  - Supabase MCP (FUTURO)   │
                                     └───────────────────────────┘
```

### 6.2 Regras de fronteira

- **A skill nunca acessa `content/` por fora do repositorio.** Mesmo que exista um
  filesystem MCP, a escrita de conteudo passa por `writeEntity` (para herdar validacao,
  politica e conflito). Um filesystem MCP cru que grave `.md` direto **contornaria os
  guardrails** — proibido para conteudo. Se um MCP de filesystem for usado, que seja em
  modo leitura ou apontando para o wrapper.
- **MCP e para recursos externos**, nao para regra de negocio: pesquisa web (para
  `agent:market-map`/`agent:problem-magnet`), leitura de git para diffs/auditoria,
  e — no futuro — Supabase. A regra de "quem pode escrever o que" vive na skill + no
  repositorio, nunca no MCP.
- **Supabase e a persistencia de producao (ADR 0001), nao mais "futuro".** Confirmou-se
  o plano: `repository.ts` ganhou um backend Supabase (`SupabaseContentStore`) espelhando
  o frontmatter, e os agentes **nao mudaram** — continuam chamando `readEntity`/
  `writeEntity` pelos CLIs. O tenant e resolvido por contexto (`withAdminContext` para os
  CLIs, no tenant do admin); a infra Supabase e detalhe invisivel para a skill. (Um MCP
  do Supabase, se um dia usado, tambem seria so infra — a regra de escrita segue no
  repositorio.)
- **Skills sao pequenas e compostaveis.** Preferir varios agentes de alcada estreita
  (secao 3) a um agente monolitico. Uma skill = uma secao/entidade de escrita.

### 6.3 O que cada camada pode e nao pode

| Camada | Pode | Nao pode |
|---|---|---|
| Skill (agente) | Ler via repo, raciocinar, propor patch | Tocar filesystem direto; elevar politica; escrever fora da alcada |
| `repository.ts` | Validar, aplicar politica/conflito, gravar atomico | Decidir estrategia de negocio |
| MCP externo | Buscar dados externos (web, git, futuro Supabase) | Ser caminho alternativo de escrita em `content/` |

---

## 7. Convencao `CLAUDE.md` / `AGENTS.md` deste repo

Dois arquivos na raiz, com papeis distintos e complementares:

- **`CLAUDE.md`** — instrucoes operacionais para o Claude Code neste repo (o "como
  trabalhar aqui"). Lido automaticamente pelo Claude Code.
- **`AGENTS.md`** — o **registro legivel dos agentes**: quem existe, alcada, politica,
  como invocar. Fonte de verdade humana; espelha `.claude/agents/*`.

### 7.1 `CLAUDE.md` (esqueleto proposto para a raiz do repo)

```markdown
# BusinessOS — Guia para agentes (CLAUDE.md)

## O que e este repo
BusinessOS: um "OS de decisao" para founder. Cada entidade do negocio e um arquivo
Markdown com frontmatter YAML em `content/<section>/<entity>.md`. Esses arquivos sao,
ao mesmo tempo, o que a UI edita e o contexto compartilhado que voce (agente) le/escreve.

## Regra de ouro
NUNCA edite arquivos em `content/` diretamente (nem via filesystem/echo/patch de texto).
SEMPRE use o contrato `lib/content/repository.ts`:
  - readEntity(id) / listEntities(section) para ler
  - writeEntity({ editor: 'agent:<slug>', baseRevision, frontmatterPatch, body }) p/ escrever
Isso garante validacao, politica de escrita, deteccao de conflito e escrita atomica.

## Antes de propor qualquer mudanca
1. readEntity(alvo) e leia `frontmatter.ai_context` (purpose, read_when, related, write_policy, instructions).
2. Se write_policy === 'founder_only' -> voce SO LE. Nao escreva.
3. Monte contexto lendo os ids em `ai_context.related` (profundidade 1).
4. Guarde o `revision` lido como baseRevision.
5. Se `status` ja === 'needs_review', existe proposta pendente: NAO empilhe outra.

## Ao escrever
- editor SEMPRE 'agent:<seu-slug>'. Nunca 'founder' nem 'system'.
- Nao defina campos de sistema (id, section, entity, created, revision, updated,
  last_edited_by, schema_version) — o repositorio controla.
- Sob write_policy 'propose', sua escrita vira status 'needs_review' automaticamente.
  Nao tente forcar 'validated'.
- Preserve os headings do template da entidade e o H1 igual ao `title`.
- Trate ConflictError re-lendo e reconciliando; nunca reenvie cego.

## Alcada
Escreva apenas nas entidades da sua alcada (ver AGENTS.md). Escrita cross-section e
proibida — leia de outras secoes para contexto, mas so proponha na sua.

## O founder aprova
Voce PROPOE; o founder DISPOE na UI. Nao ha execucao autonoma "final".

## Stack (nao re-litigar)
Next.js App Router + TS, Tailwind + shadcn/ui, Inter, P&B minimalista.
Persistencia de producao: Postgres/Supabase multi-tenant + auth (RLS); modo `file`
(MD em content/) segue para dev/testes. A FORMA do conteudo nao mudou. Ver ADR 0001.
```

> **Nota de atualizacao (ADR 0001).** O bloco "Stack" acima e um exemplo do `CLAUDE.md`;
> foi atualizado junto com o arquivo real. Para agentes de CLI, nada muda no fluxo
> (mesma porta, mesmos CLIs); no modo `supabase` eles operam no tenant do admin via
> `withAdminContext`.

### 7.2 `AGENTS.md` (registro legivel — esqueleto)

```markdown
# BusinessOS — Registro de Agentes (AGENTS.md)

Cada agente e um subagente/skill em `.claude/agents/<slug>.md`. `slug` vira
`last_edited_by: agent:<slug>` nos arquivos que ele propoe.

| slug | secao | le | escreve (propoe) | write_policy alvo | invocar por |
|---|---|---|---|---|---|
| founder-coach   | founder   | founder/*                                   | founder/objetivo             | propose      | "articular objetivo" |
| market-map      | direcao   | direcao/mapa-do-mercado, ima-de-problemas   | direcao/mapa-do-mercado      | propose      | "mapear mercado" |
| problem-magnet  | direcao   | direcao/ima-de-problemas, founder/*         | direcao/ima-de-problemas     | propose      | "listar problemas" |
| icp             | direcao   | direcao/perfil-ideal-de-cliente + related   | direcao/perfil-ideal-de-cliente | propose  | "definir ICP" |
| value-thesis    | direcao   | direcao/tese-de-valor + related             | direcao/tese-de-valor        | propose      | "propor tese de valor" |
| offer-strategist| direcao   | direcao/oferta, tese-de-valor               | direcao/oferta               | propose      | "montar oferta" |
| validation-synth| validacao | validacao/*, direcao/perfil-ideal-de-cliente| validacao/oferta, primeiros-clientes | propose | "sintetizar validacao" |
| cash-flow       | caixa     | caixa/fluxo-de-caixa                         | caixa/fluxo-de-caixa         | propose      | "resumir caixa/runway" |
| seed-assistant  | (todas)   | entidade-alvo                               | qualquer status:empty        | propose      | "preencher rascunho" |
| context-linter  | (todas)   | content/**                                  | — (so relata)                | read-only    | "validar contexto" |
| summarizer      | (todas)   | entidade-alvo                               | patch em summary             | propose      | "atualizar resumo" |

## Convencoes
- founder_only (estilo-de-vida, erp): NENHUM agente escreve; so leem.
- Oferta duplicada: offer-strategist -> direcao/oferta; validation-synth -> validacao/oferta.
  Sem sync automatico entre os dois.
- Todo agente respeita os guardrails de docs/05-agent-integration.md secao 5.
```

### 7.3 Anatomia de um subagente em `.claude/agents/<slug>.md`

```markdown
---
name: value-thesis
description: >
  Propoe/atualiza a tese de valor (direcao/tese-de-valor) a partir do ICP e dos
  problemas. Use quando o founder quiser formular ou revisar por que o cliente pagaria.
tools: [Read, repository]   # acesso ao wrapper; sem escrita crua no filesystem
---

Voce e o agente `agent:value-thesis`. Alcada de escrita: SOMENTE `direcao/tese-de-valor`.

Passos:
1. readEntity('direcao/tese-de-valor'); guarde revision como baseRevision.
2. Se write_policy for founder_only, pare (nao ocorre aqui, mas cheque).
3. Leia related: direcao/perfil-ideal-de-cliente e direcao/ima-de-problemas.
4. Ancore a hipotese nas dores do ICP (ai_context.instructions manda nao inventar
   segmentos fora do ICP).
5. writeEntity({ editor:'agent:value-thesis', baseRevision, frontmatterPatch:{ summary,
   tags, hypothesis, confidence }, body }). NAO defina status (o repo poe needs_review).
6. Em ConflictError: re-leia e reconcilie. Se status ja for needs_review, avise e pare.
7. Reporte ao founder: o que mudou e por que, apontando para a revisao na UI.
```

---

## 8. Exemplos de workflow por secao

Cada exemplo mostra o ciclo completo **ler -> propor -> revisar**, com o estado do
frontmatter antes/depois. Todos assumem os guardrails da secao 5.

### 8.1 `direcao` — `agent:value-thesis` propoe a tese de valor

**Gatilho.** Founder: *"a partir do meu ICP e dos problemas, proponha uma tese de valor."*

**Leitura.**
```
readEntity('direcao/tese-de-valor')      # status: draft, revision: 1  -> baseRevision=1
readEntity('direcao/perfil-ideal-de-cliente')  # via ai_context.related
readEntity('direcao/ima-de-problemas')         # via ai_context.related
```

**Raciocinio.** Cruza ICP (founder solo, estagio ideia->primeiros clientes) com as
dores priorizadas em `ima-de-problemas` (fragmentacao de contexto). Respeita
`ai_context.instructions`: "nao invente segmentos fora do ICP".

**Escrita.**
```ts
writeEntity({
  editor: 'agent:value-thesis',
  baseRevision: 1,
  frontmatterPatch: {
    summary: 'Founders solo perdem contexto entre ferramentas; um OS de decisao em MD ...',
    tags: ['valor', 'hipotese', 'contexto'],
    hypothesis: 'Reduzir fragmentacao de contexto vale pagamento recorrente ...',
    confidence: 'medium',
  },
  body: '# Tese de valor\n\n## Hipotese\n...\n## Riscos da tese\n...',
});
```

**Resultado (enforced pelo repo).** `revision: 2`, `updated: now`,
`last_edited_by: agent:value-thesis`, **`status: needs_review`** (write_policy=propose).

**Revisao.** A UI mostra o card de `tese-de-valor` com selo "Proposto por IA". O founder
le, ajusta uma frase e aprova:
```ts
writeEntity({ editor: 'founder', baseRevision: 2,
  frontmatterPatch: { status: 'validated' }, body: '...(corpo revisado)...' });
// -> revision: 3, last_edited_by: founder, status: validated
```

### 8.2 `founder` — `agent:founder-coach` e o limite `founder_only`

**Gatilho.** *"me ajude a deixar meu objetivo mais nitido e reveja meu estilo de vida."*

- Em `founder/objetivo` (write_policy `propose`): o agente le, propoe refinar
  "Como sabemos que chegamos" (metas mensuraveis) -> escrita entra como `needs_review`.
- Em `founder/estilo-de-vida` (write_policy **`founder_only`**): o agente **le** para
  calibrar o objetivo (renda-alvo, horas/semana), mas ao tentar escrever recebe
  **`PolicyError`**. Comportamento correto: **nao escrever**; em vez disso, sugerir ao
  founder, em texto, o que ele mesmo poderia ajustar la. Isso demonstra o guardrail de
  areas so-leitura.

### 8.3 `validacao` — `agent:validation-synth` fecha o loop tese->evidencia

**Gatilho.** *"consolide o aprendizado dos primeiros clientes e ajuste a oferta validada."*

**Leitura.**
```
readEntity('validacao/primeiros-clientes')   # baseRevision_pc
readEntity('validacao/oferta')               # baseRevision_of
readEntity('direcao/perfil-ideal-de-cliente')# contexto (related)
```

**Raciocinio.** Extrai padroes: "onboarding do contexto inicial e o gargalo"; "1 de 3
paga". Deriva ajuste na oferta validada (ex.: incluir seed assistido no pacote).

**Escrita (duas entidades da MESMA secao, cada uma com seu baseRevision).**
```ts
// 1) atualiza aprendizados em primeiros-clientes
writeEntity({ editor:'agent:validation-synth', baseRevision: baseRevision_pc,
  frontmatterPatch:{ summary:'...', paying_count:1 }, body:'...## Aprendizados...' });
// 2) propoe ajuste na oferta validada
writeEntity({ editor:'agent:validation-synth', baseRevision: baseRevision_of,
  frontmatterPatch:{ summary:'Oferta ganha onboarding assistido ...' }, body:'...## Ajustes...' });
```
Ambas viram `needs_review`. **Nao toca** `direcao/oferta` (R-OFERTA): se a mudanca
sugerir rever a tese, o agente **aponta** isso ao founder para acionar
`agent:offer-strategist` — nao escreve na secao `direcao`.

**Conflito realista.** Se o founder editou `validacao/oferta` enquanto o agente
raciocinava, o segundo `writeEntity` lanca `ConflictError`. O agente re-le
`validacao/oferta`, verifica se seu ajuste ainda faz sentido, e ou reconcilia ou
desiste avisando "voce ja atualizou a oferta; minha sugestao virou redundante".

### 8.4 `caixa` — `agent:cash-flow` resume o mes e calcula runway

**Gatilho.** *"atualize o resumo de caixa deste mes e recalcule o runway."*

**Leitura.** `readEntity('caixa/fluxo-de-caixa')` (baseRevision). Le `net_month` e
entradas/saidas do corpo. Respeita `ai_context.instructions`: "documento de contexto,
nao razao contabil; nao lancar transacoes; resumir e projetar".

**Escrita.**
```ts
writeEntity({ editor:'agent:cash-flow', baseRevision,
  frontmatterPatch:{ summary:'Julho/2026: saldo -R$2.600; runway ~8 meses',
    net_month:-2600, runway_months:8, tags:['caixa','runway'] },
  body:'# Fluxo de caixa\n\n## Resumo do mes\n...\n## Saldo e runway\n...' });
// -> needs_review; founder confirma os numeros e valida.
```

**Limite.** O agente **nao** cria `caixa/erp` nem escreve nele (`founder_only`). Se
precisar de dado que so existe no ERP, le `caixa/erp` para contexto e, faltando dado,
pede ao founder — nao inventa.

### 8.5 Onboarding — `agent:seed-assistant` preenche um `status: empty`

**Gatilho.** Founder abre um card `empty` (ex.: `direcao/mapa-do-mercado`) e clica
"Pedir a IA para comecar".

- O agente conversa 3–4 perguntas curtas, gera o primeiro rascunho respeitando o
  template de headings (content-model 8.3) e escreve como `needs_review`.
- Resolve diretamente o aprendizado registrado em `validacao/primeiros-clientes`
  ("seed vazio assusta; pedido recorrente: agente que preenche o primeiro rascunho").
- Nunca marca `validated`: o primeiro conteudo real e sempre revisado pelo founder.

---

## 9. Sequencia end-to-end (referencia visual)

```
Founder (UI/CLI)                Skill (agent:<slug>)           repository.ts            content/*.md (git)
      │  "proponha X"                  │                             │                        │
      ├───────────────────────────────►│  readEntity(alvo)           │                        │
      │                                ├────────────────────────────►│  parse+validate        │
      │                                │                             ├───────────────────────►│  (le arquivo)
      │                                │◄──── frontmatter+body ───────┤◄───────────────────────┤
      │                                │  readEntity(related...)     │                        │
      │                                │  (raciocina)                │                        │
      │                                │  writeEntity(editor=agent,  │                        │
      │                                ├──  baseRevision, patch) ────►│  conflito? politica?   │
      │                                │                             │  status=needs_review   │
      │                                │                             ├── escrita atomica ─────►│  (revision+1)
      │◄──── "proposta pronta p/ revisao" (needs_review) ────────────┤◄───────────────────────┤
      │  abre card "Proposto por IA"   │                             │                        │
      ├──  writeEntity(editor=founder, status=validated) ───────────►│  (aprova) ─────────────►│  (revision+1)
      ▼                                                                                        ▼
```

---

## 10. Checklist de conformidade (Definition of Done da integracao)

- [ ] Todo agente le/escreve **exclusivamente** via `readEntity`/`writeEntity` — zero
      acesso cru ao filesystem de conteudo.
- [ ] Todo `writeEntity` de agente usa `editor: 'agent:<slug>'` e um `baseRevision` real.
- [ ] `write_policy: founder_only` bloqueia escrita de agente (`PolicyError`) — testado
      em `estilo-de-vida` e `erp`.
- [ ] Escrita de agente sob `propose` sempre resulta em `status: needs_review`.
- [ ] `ConflictError` e tratado com re-leitura+reconciliacao (nunca reenvio cego).
- [ ] Campos de sistema nunca sao definidos pelo agente (repo os controla).
- [ ] Cada agente escreve so na sua alcada; cross-section e apenas leitura.
- [ ] Oferta duplicada respeitada: um `writeEntity` por arquivo, sem sync automatico.
- [ ] `CLAUDE.md` (raiz) e `AGENTS.md` (registro) presentes e coerentes com
      `.claude/agents/*`.
- [ ] Nenhum MCP e usado como caminho alternativo de escrita em `content/`.
- [ ] Existe >= 1 fluxo real demonstravel (PRD metrica 10.1: agente le MD e escreve
      atualizacao valida aprovada pelo founder).

---

## 11. Dependencias a montante e a jusante

**A montante (fixam o que este doc assume):**
- `docs/00-briefing.md` — visao canonica; MD+frontmatter como contexto compartilhado.
- `docs/01-prd.md` — R-AG-01..06 (acesso de agentes), persona agente (3.2), nao-objetivo
  de execucao autonoma (2.2).
- `docs/02-content-model.md` — **o contrato de forma e de escrita**: `ai_context`,
  `write_policy`, `revision`/conflito, `Editor`, `readEntity`/`writeEntity`, fluxo
  `propose -> needs_review`. Este doc nao redefine nada disso; especifica o
  comportamento dos agentes sobre ele.

**A jusante (o que este doc alimenta):**
- **Implementacao das skills** — `.claude/agents/<slug>.md` para cada agente da secao 3,
  mais `CLAUDE.md`/`AGENTS.md` na raiz (secao 7).
- **Superficie de revisao na UI** — botao "Pedir a IA", selo "Proposto por IA" derivado
  de `status: needs_review` + `last_edited_by: agent:*`, e a acao de aprovar/rejeitar
  (design-system 7.2, content-model 11).
- **Plano de QA** — traduz o checklist da secao 10 e os erros da secao 5.8 em casos de
  teste (conflito, politica, validacao, alcada).
- **Plano Supabase futuro** — quando existir, o backend muda dentro de `repository.ts`;
  os agentes e este contrato **nao mudam** (secao 6.2).
