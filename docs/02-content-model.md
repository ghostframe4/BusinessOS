---
doc: content-model
title: Modelo de Conteudo (MD + Frontmatter)
status: canonico
versao: 1.0.0
owner: ruanbraz@overlens.com.br
atualizado_em: 2026-07-11
tags: [conteudo, frontmatter, schema, contrato, contexto, multi-agente]
depends_on: [docs/00-briefing.md]
---

# BusinessOS — Modelo de Conteudo (MD + Frontmatter)

> **O coracao do sistema.** Este documento define como cada entidade do negocio e
> persistida como **um arquivo Markdown com frontmatter YAML** em `content/`. Esse
> mesmo arquivo e, ao mesmo tempo, o que a UI edita (via formularios/cards) e o que
> agentes de IA e skills leem/escrevem. O schema aqui e o **contrato de contexto** de
> primeira classe do produto.
>
> Consistente com `docs/00-briefing.md` (fonte canonica). O briefing delega
> explicitamente "o schema exato do frontmatter" para este doc (secao 6 e 12 do
> briefing); portanto **este documento e a autoridade sobre a forma dos arquivos de
> entidade**. Em conflito de visao/escopo, o briefing prevalece.

> **Nota de atualizacao (ADR 0001 — persistencia Supabase multi-tenant).** A **fonte de
> verdade** deixou de ser os arquivos `content/` e passou a ser o **Postgres/Supabase**
> (`CONTENT_STORE=supabase`), com uma copia das entidades **por usuario** (multi-tenant,
> RLS). O que **este documento define — a FORMA do conteudo** (frontmatter, schema zod,
> enums, `ai_context`, `REGISTRY`, templates, invariantes) — **continua valendo tal e
> qual**: no banco, cada entidade e uma linha em `content_entities` cujo `frontmatter`
> (jsonb) + `body` espelham exatamente este modelo. Mudou apenas a **camada de
> persistencia** (a interface `ContentStore`), nao a forma. O modo `file` (arquivos MD)
> permanece como fallback de dev/testes. Onde o texto abaixo diz "arquivo"/"disco"/"fonte
> unica", leia "a entidade persistida pela porta unica `lib/content/repository`", que
> hoje resolve o store por contexto (arquivo **ou** linha do banco). Ver `docs/04` §2,
> §5 e §11 e o ADR 0001.

---

## 1. Objetivo e escopo deste documento

Definir, de forma pronta para implementacao:

1. O **layout do diretorio** `content/`.
2. A **anatomia** de um arquivo de entidade (frontmatter + corpo).
3. O **schema preciso do frontmatter** (campos core + campos por-tipo).
4. Os **enums canonicos** (`section`, `status`, etc.).
5. O campo **`ai_context`** — o contrato de contexto para agentes.
6. O **registro canonico de TODAS as 11 entidades** com frontmatter inicial (seed).
7. O mapeamento **card <-> arquivo**.
8. O tratamento de **versao / `updated` / conflito**.
9. Um **tipo TS + schema Zod/JSON** para validacao em runtime.
10. O **contrato de leitura/escrita** compartilhado por UI e agentes.
11. **Exemplos completos de arquivo MD** — ao menos um por secao.
12. **Regras de validacao e invariantes.**

Fora de escopo: componentes de UI (design system), arquitetura Next.js e o plano
Supabase (documentados em outros docs). Aqui tratamos apenas do **substrato de
conteudo**.

---

## 2. Reconciliacao de idioma dos campos (decisao)

O briefing mostrou um exemplo *ilustrativo* de frontmatter com chaves em portugues
(`secao`, `entidade`, `titulo`, `atualizado_em`) e declarou que "o schema exato ...
e definido nos docs subsequentes".

**Decisao canonica deste doc:** as **chaves do frontmatter e os valores de enum sao
identificadores** e, pela regra do briefing ("termos tecnicos e identificadores
permanecem em ingles"), ficam **em ingles** (`section`, `entity`, `title`, `updated`,
`status: draft`, ...). O **conteudo** (title, summary, corpo) permanece em **pt-BR**.
A UI faz o mapeamento enum -> rotulo em portugues (ver secao 6.5).

Isso supera o exemplo ilustrativo do briefing sem conflitar com ele (o briefing so
fixava o *principio* MD + frontmatter, nao as chaves).

---

## 3. Layout do diretorio `content/`

```
content/
├── founder/
│   ├── objetivo.md
│   └── estilo-de-vida.md
├── direcao/
│   ├── mapa-do-mercado.md
│   ├── ima-de-problemas.md
│   ├── perfil-ideal-de-cliente.md
│   ├── tese-de-valor.md
│   └── oferta.md
├── validacao/
│   ├── oferta.md
│   └── primeiros-clientes.md
└── caixa/
    ├── fluxo-de-caixa.md
    └── erp.md
```

Regras do layout:

- **1 secao = 1 subdiretorio** de `content/`. As quatro: `founder`, `direcao`,
  `validacao`, `caixa`.
- **1 entidade = 1 arquivo** `content/<section>/<entity>.md`. Sem multiplexacao,
  sem sub-subdiretorios, sem arquivos de indice manuais dentro de `content/`.
- Nome de arquivo = **slug kebab-case** da entidade (`[a-z0-9-]+`), com extensao
  `.md`. O slug e o campo `entity`.
- `oferta` existe em **dois** arquivos distintos: `content/direcao/oferta.md` (tese)
  e `content/validacao/oferta.md` (evidencia validada). Sao entidades separadas com
  ids diferentes.
- Sem estado paralelo: existe **uma unica fonte de verdade** por entidade, acessada
  pela porta unica (`lib/content/repository`). A UI e um *editor* dessa fonte, nao um
  espelho independente. (Desde o ADR 0001, essa fonte e o banco no modo `supabase`; o
  layout `content/` acima descreve o modo `file` e a semente historica do admin.)
- Encoding **UTF-8**, quebras de linha **LF**, sem BOM.

> O conjunto de arquivos validos NAO e inferido do filesystem — e fixado por um
> **registro canonico em codigo** (secao 8). O filesystem apenas materializa esse
> registro; arquivos fora do registro sao ignorados/avisados pela UI.

---

## 4. Anatomia de um arquivo de entidade

Todo arquivo tem duas partes:

```markdown
---
# (1) FRONTMATTER — YAML entre marcadores `---`. Metadados estruturados.
id: direcao/tese-de-valor
section: direcao
entity: tese-de-valor
title: "Tese de valor"
status: draft
...
---

# (2) CORPO — Markdown. Conteudo narrativo/estruturado.

## Hipotese
...
```

Convencoes:

- **Frontmatter** delimitado por `---` na primeira linha e por `---` fechando.
  Parseado com `gray-matter` (YAML 1.1). Ordem das chaves e estabilizada na escrita
  (secao 7.3) para diffs limpos.
- **Corpo** e Markdown padrao. A primeira linha de conteudo DEVE ser um `#` H1 igual
  ao `title` (fonte de exibicao continua sendo o campo `title`; o H1 e para leitura
  humana/editor). As demais secoes usam `##` conforme o template por-entidade
  (secao 8.3).
- Um arquivo sem corpo (so frontmatter, `status: empty`) e valido — e o estado de
  **seed** de uma entidade ainda nao preenchida.

---

## 5. Schema do frontmatter — campos core

Campos presentes em **todas** as entidades. Tipos referem-se ao TS/Zod da secao 7.

| Campo | Tipo | Obrig. | Origem | Descricao |
|---|---|---|---|---|
| `id` | `string` | sim | task-core | Chave primaria estavel. **Sempre** `"<section>/<entity>"`. Igual ao caminho do arquivo sem `content/` e sem `.md`. Nunca muda. |
| `section` | `Section` (enum) | sim | task-core | Secao dona da entidade: `founder \| direcao \| validacao \| caixa`. |
| `entity` | `string` (slug) | sim | derivado | Slug kebab-case da entidade, unico dentro da secao. Igual ao nome do arquivo. Redundante-por-design com `id` (validado). |
| `title` | `string` | sim | task-core | Titulo de exibicao (pt-BR). Aparece no card e no H1. |
| `status` | `Status` (enum) | sim | task-core | Estado do ciclo de vida. Ver 6.2. |
| `summary` | `string` | sim | task-core | 1–2 frases (pt-BR) resumindo o estado atual. Exibido no card e usado por agentes como TL;DR. Pode ser `""` em seed. |
| `tags` | `string[]` | sim | task-core | Etiquetas livres (kebab-case sugerido). Pode ser `[]`. |
| `owner` | `string` (email) | sim | task-core | Responsavel humano. Default: email do founder. |
| `order` | `number` (int >= 0) | sim | task-core | Ordem do card dentro da pagina da secao (asc). |
| `updated` | `string` (ISO 8601) | sim | task-core | Timestamp da ultima escrita. Reescrito a cada save. Ver secao 9. |
| `ai_context` | `AiContext` (objeto) | sim | task-core | Contrato de uso por agentes. Ver secao 6.6. |
| `created` | `string` (ISO 8601) | sim | sistema | Timestamp de criacao. Definido uma vez; nunca reescrito. |
| `revision` | `number` (int >= 1) | sim | sistema | Contador monotonico. `+1` a cada escrita. Usado para deteccao de conflito. |
| `last_edited_by` | `Editor` | sim | sistema | Quem fez a ultima escrita: `founder \| system \| agent:<name>`. |
| `schema_version` | `1` (literal) | sim | sistema | Versao do schema de frontmatter. Atual = `1`. Permite migracao futura. |
| *(campos por-tipo)* | varios | nao | por-entidade | Campos opcionais especificos da entidade. Ver secao 8.2. |

Notas:

- **task-core** = campos explicitamente pedidos no escopo (`id, section, title,
  status, updated, tags, owner, summary, ai_context, order`).
- **sistema** = campos adicionados para versao/auditoria/evolucao (justificados nas
  secoes 9 e 11).
- Todos os campos por-tipo vivem no **mesmo nivel plano** do frontmatter (sem
  aninhamento por secao), validados por um schema de extensao por-entidade (7.2).

---

## 6. Enums canonicos e `ai_context`

### 6.1 `Section`

```
founder | direcao | validacao | caixa
```

Ordem de navegacao na sidebar segue exatamente essa sequencia (espelha a construcao
do negocio: quem constroi -> para onde -> o que foi testado -> como entra dinheiro).

### 6.2 `Status` (ciclo de vida da entidade)

| Valor | Rotulo pt-BR (UI) | Significado |
|---|---|---|
| `empty` | Vazio | Seed; ainda nao preenchido. |
| `draft` | Rascunho | Em elaboracao inicial pelo founder. |
| `in_progress` | Em progresso | Sendo trabalhado ativamente. |
| `needs_review` | Aguardando revisao | Proposto por agente; espera aprovacao do founder. |
| `validated` | Validado | Confirmado com a realidade / aprovado. |
| `archived` | Arquivado | Fora de uso, mantido por historico. |

Transicoes tipicas: `empty -> draft -> in_progress -> validated`. Uma escrita de
agente sob politica `propose` força `needs_review` (ver 6.6 e 10.4).

### 6.3 `WritePolicy` (por entidade, dentro de `ai_context`)

| Valor | Significado |
|---|---|
| `founder_only` | Agentes NAO escrevem; apenas leem. Escrita so pela UI/founder. |
| `propose` | Agentes podem escrever, mas a escrita entra como `status: needs_review`. **Default.** |
| `open` | Agentes escrevem livremente (status conforme o conteudo). Usar com parcimonia. |

### 6.4 `Editor` (valor de `last_edited_by`)

```
'founder' | 'system' | `agent:${slug}`   // ex.: 'agent:direcao-strategist'
```

`system` = escrita automatizada nao-agente (ex.: seed inicial, migracao de schema).

### 6.5 Mapa enum -> rotulo (UI)

A UI mantem um dicionario `pt-BR` para renderizar rotulos; os arquivos guardam sempre
o identificador em ingles. Ex.: `SECTION_LABEL = { founder: 'Founder', direcao:
'Direcao', validacao: 'Validacao', caixa: 'Caixa' }`, `STATUS_LABEL` conforme 6.2.

### 6.6 `ai_context` — o contrato de contexto para agentes

Campo estruturado que instrui **como agentes devem usar a entidade**. E o que torna
o MD um contrato de contexto de primeira classe (nao so um doc).

```ts
interface AiContext {
  purpose: string;          // obrig. Para que serve esta entidade, em termos de agente.
  read_when?: string[];     // situacoes em que um agente deve ler este arquivo.
  write_policy?: WritePolicy;// default 'propose'. Ver 6.3.
  related?: string[];       // ids de entidades relacionadas (montagem de contexto).
  instructions?: string;    // orientacao livre ao agente (limites, tom, o que evitar).
}
```

Uso pratico:

- Um agente que vai propor `direcao/tese-de-valor` le o `related` desse arquivo
  (`direcao/perfil-ideal-de-cliente`, `direcao/ima-de-problemas`) para montar contexto
  sem hardcode.
- `read_when` deixa o roteamento de skills declarativo ("leia quando for propor
  preco", etc.).
- `write_policy` e a **fonte de verdade da permissao de escrita** de agentes por
  entidade (o contrato de escrita, secao 10.4, o consulta).

---

## 7. Tipo TS e schema Zod/JSON

Localizacao sugerida: `lib/content/schema.ts`. O **mesmo** schema valida escrita da
UI e de agentes (fonte unica de verdade de forma).

### 7.1 Tipos TypeScript

```ts
// lib/content/schema.ts
export type Section = 'founder' | 'direcao' | 'validacao' | 'caixa';

export type Status =
  | 'empty'
  | 'draft'
  | 'in_progress'
  | 'needs_review'
  | 'validated'
  | 'archived';

export type WritePolicy = 'founder_only' | 'propose' | 'open';

export type Editor = 'founder' | 'system' | `agent:${string}`;

export interface AiContext {
  purpose: string;
  read_when?: string[];
  write_policy?: WritePolicy; // default 'propose'
  related?: string[];         // ids de entidades relacionadas
  instructions?: string;
}

/** Campos core presentes em toda entidade. Campos por-tipo entram via extensao. */
export interface Frontmatter {
  id: `${Section}/${string}`;
  section: Section;
  entity: string;
  title: string;
  status: Status;
  summary: string;
  tags: string[];
  owner: string;      // email
  order: number;      // int >= 0
  created: string;    // ISO 8601
  updated: string;    // ISO 8601
  revision: number;   // int >= 1
  last_edited_by: Editor;
  ai_context: AiContext;
  schema_version: 1;
  // Campos por-tipo (opcionais) — ver secao 8.2:
  [key: string]: unknown;
}

/** Documento completo: frontmatter + corpo Markdown + caminho no disco. */
export interface EntityDoc {
  frontmatter: Frontmatter;
  body: string;                 // Markdown apos o frontmatter
  path: string;                 // ex.: 'content/direcao/tese-de-valor.md'
}

/** Projecao usada por listagens/cards (nao carrega o corpo). */
export interface EntityMeta {
  id: string;
  section: Section;
  entity: string;
  title: string;
  status: Status;
  summary: string;
  tags: string[];
  order: number;
  updated: string;
  last_edited_by: Editor;
}
```

### 7.2 Schema Zod (validacao em runtime)

```ts
// lib/content/schema.ts (cont.)
import { z } from 'zod';

export const sectionEnum = z.enum(['founder', 'direcao', 'validacao', 'caixa']);

export const statusEnum = z.enum([
  'empty', 'draft', 'in_progress', 'needs_review', 'validated', 'archived',
]);

export const writePolicyEnum = z.enum(['founder_only', 'propose', 'open']);

export const editorSchema = z.union([
  z.literal('founder'),
  z.literal('system'),
  z.string().regex(/^agent:[a-z0-9-]+$/),
]);

export const aiContextSchema = z.object({
  purpose: z.string().min(1),
  read_when: z.array(z.string()).optional(),
  write_policy: writePolicyEnum.default('propose'),
  related: z.array(z.string()).optional(),
  instructions: z.string().optional(),
});

/** Schema base (campos core). `.passthrough()` deixa campos por-tipo passarem. */
export const frontmatterSchema = z
  .object({
    id: z.string().regex(/^[a-z-]+\/[a-z0-9-]+$/),
    section: sectionEnum,
    entity: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    status: statusEnum,
    summary: z.string(),
    tags: z.array(z.string()),
    owner: z.string().email(),
    order: z.number().int().nonnegative(),
    created: z.string().datetime({ offset: true }),
    updated: z.string().datetime({ offset: true }),
    revision: z.number().int().min(1),
    last_edited_by: editorSchema,
    ai_context: aiContextSchema,
    schema_version: z.literal(1),
  })
  .passthrough()
  .refine((d) => d.id === `${d.section}/${d.entity}`, {
    message: 'id deve ser exatamente `${section}/${entity}`',
    path: ['id'],
  });

export type FrontmatterInput = z.input<typeof frontmatterSchema>;
export type FrontmatterParsed = z.output<typeof frontmatterSchema>;
```

Extensoes por-tipo (secao 8.2) sao `z.object({...})` mescladas por `id` num mapa
`ENTITY_EXTENSIONS: Record<string, z.ZodObject>`; a validacao completa faz
`frontmatterSchema.and(ENTITY_EXTENSIONS[id] ?? z.object({}))`.

### 7.3 Equivalente JSON Schema (para consumidores nao-TS / agentes)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "BusinessOS Frontmatter (core)",
  "type": "object",
  "required": ["id","section","entity","title","status","summary","tags","owner",
    "order","created","updated","revision","last_edited_by","ai_context",
    "schema_version"],
  "additionalProperties": true,
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z-]+/[a-z0-9-]+$" },
    "section": { "enum": ["founder","direcao","validacao","caixa"] },
    "entity": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "title": { "type": "string", "minLength": 1 },
    "status": { "enum": ["empty","draft","in_progress","needs_review","validated","archived"] },
    "summary": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } },
    "owner": { "type": "string", "format": "email" },
    "order": { "type": "integer", "minimum": 0 },
    "created": { "type": "string", "format": "date-time" },
    "updated": { "type": "string", "format": "date-time" },
    "revision": { "type": "integer", "minimum": 1 },
    "last_edited_by": { "type": "string",
      "pattern": "^(founder|system|agent:[a-z0-9-]+)$" },
    "schema_version": { "const": 1 },
    "ai_context": {
      "type": "object",
      "required": ["purpose"],
      "properties": {
        "purpose": { "type": "string", "minLength": 1 },
        "read_when": { "type": "array", "items": { "type": "string" } },
        "write_policy": { "enum": ["founder_only","propose","open"] },
        "related": { "type": "array", "items": { "type": "string" } },
        "instructions": { "type": "string" }
      }
    }
  }
}
```

---

## 8. Registro canonico das entidades

### 8.1 Registro em codigo (a lista de verdade)

O conjunto valido de entidades e fixado em `lib/content/registry.ts`. E ele — e nao o
filesystem — que a UI usa para renderizar a sidebar/paginas e que o seeder usa para
criar arquivos ausentes.

```ts
// lib/content/registry.ts
export interface EntityDef {
  id: string;
  section: Section;
  entity: string;
  title: string;
  order: number;
  defaultWritePolicy: WritePolicy;
  purpose: string;         // vira ai_context.purpose no seed
  related?: string[];      // vira ai_context.related no seed
}

export const REGISTRY: EntityDef[] = [
  // founder
  { id: 'founder/objetivo', section: 'founder', entity: 'objetivo',
    title: 'Objetivo', order: 1, defaultWritePolicy: 'propose',
    purpose: 'O que o founder quer alcancar com este negocio.' },
  { id: 'founder/estilo-de-vida', section: 'founder', entity: 'estilo-de-vida',
    title: 'Estilo de vida', order: 2, defaultWritePolicy: 'founder_only',
    purpose: 'A vida (tempo, renda, liberdade) que o negocio precisa sustentar.' },

  // direcao
  { id: 'direcao/mapa-do-mercado', section: 'direcao', entity: 'mapa-do-mercado',
    title: 'Mapa do mercado', order: 1, defaultWritePolicy: 'propose',
    purpose: 'O territorio onde o negocio joga.' },
  { id: 'direcao/ima-de-problemas', section: 'direcao', entity: 'ima-de-problemas',
    title: 'Ima de problemas', order: 2, defaultWritePolicy: 'propose',
    purpose: 'Os problemas que atraem o founder e valem ser resolvidos.' },
  { id: 'direcao/perfil-ideal-de-cliente', section: 'direcao',
    entity: 'perfil-ideal-de-cliente', title: 'Perfil ideal de cliente', order: 3,
    defaultWritePolicy: 'propose', purpose: 'O ICP: para quem exatamente.' },
  { id: 'direcao/tese-de-valor', section: 'direcao', entity: 'tese-de-valor',
    title: 'Tese de valor', order: 4, defaultWritePolicy: 'propose',
    purpose: 'Por que esse cliente pagaria; a hipotese de valor.',
    related: ['direcao/perfil-ideal-de-cliente', 'direcao/ima-de-problemas'] },
  { id: 'direcao/oferta', section: 'direcao', entity: 'oferta',
    title: 'Oferta (tese)', order: 5, defaultWritePolicy: 'propose',
    purpose: 'A oferta como intencao estrategica (versao direcao).',
    related: ['direcao/tese-de-valor'] },

  // validacao
  { id: 'validacao/oferta', section: 'validacao', entity: 'oferta',
    title: 'Oferta (validada)', order: 1, defaultWritePolicy: 'propose',
    purpose: 'A oferta como e testada/refinada em campo (versao validacao).',
    related: ['direcao/oferta'] },
  { id: 'validacao/primeiros-clientes', section: 'validacao',
    entity: 'primeiros-clientes', title: 'Primeiros clientes', order: 2,
    defaultWritePolicy: 'propose',
    purpose: 'Os primeiros clientes reais e o aprendizado extraido deles.',
    related: ['validacao/oferta', 'direcao/perfil-ideal-de-cliente'] },

  // caixa
  { id: 'caixa/fluxo-de-caixa', section: 'caixa', entity: 'fluxo-de-caixa',
    title: 'Fluxo de caixa', order: 1, defaultWritePolicy: 'propose',
    purpose: 'Entradas e saidas ao longo do tempo.' },
  { id: 'caixa/erp', section: 'caixa', entity: 'erp',
    title: 'ERP', order: 2, defaultWritePolicy: 'founder_only',
    purpose: 'Documento de contexto sobre operacao/registro financeiro (nao modulo transacional).' },
];
```

### 8.2 Campos por-tipo (opcionais) por entidade

Vivem no nivel plano do frontmatter; validados por extensao (7.2). Todos opcionais.

| Entidade (`id`) | Campos por-tipo | Tipo |
|---|---|---|
| `founder/objetivo` | `time_horizon`, `north_star_metric` | `string`, `string` |
| `founder/estilo-de-vida` | `target_income_month`, `work_hours_week` | `number` (BRL), `number` |
| `direcao/mapa-do-mercado` | `market`, `maturity` | `string`, `'nascent'\|'growing'\|'mature'` |
| `direcao/ima-de-problemas` | `top_problem` | `string` |
| `direcao/perfil-ideal-de-cliente` | `segment`, `persona` | `string`, `string` |
| `direcao/tese-de-valor` | `hypothesis`, `confidence` | `string`, `'low'\|'medium'\|'high'` |
| `direcao/oferta` | `pricing_model`, `price` | `string`, `number` |
| `validacao/oferta` | `experiments_run`, `conversion_rate` | `number`, `number` (0–1) |
| `validacao/primeiros-clientes` | `customers_count`, `paying_count` | `number`, `number` |
| `caixa/fluxo-de-caixa` | `currency`, `net_month`, `runway_months` | `string`, `number`, `number` |
| `caixa/erp` | `system_name`, `tax_regime` | `string`, `string` |

### 8.3 Templates de corpo (headings recomendados) por entidade

Skeleton que o seeder e os formularios usam. Headings sao `##`.

| Entidade | Secoes do corpo (`##`) |
|---|---|
| `founder/objetivo` | Objetivo principal · Por que agora · Como sabemos que chegamos · Restricoes |
| `founder/estilo-de-vida` | Vida que o negocio sustenta · Tempo · Renda · Liberdade e inegociaveis |
| `direcao/mapa-do-mercado` | Territorio · Players e alternativas · Tendencias · Onde jogamos |
| `direcao/ima-de-problemas` | Problemas que atraem · Evidencia de dor · Priorizacao |
| `direcao/perfil-ideal-de-cliente` | Quem e · Contexto e gatilhos · Dores · Onde encontrar · Anti-perfil |
| `direcao/tese-de-valor` | Hipotese · Para quem · Por que pagariam · Evidencias · Riscos da tese |
| `direcao/oferta` | Promessa · Formato e entrega · Preco e modelo · Diferencial |
| `validacao/oferta` | Oferta em teste · Experimentos · Resultados · Ajustes · Decisao |
| `validacao/primeiros-clientes` | Clientes · Como chegaram · O que compraram · Aprendizados · Proximos passos |
| `caixa/fluxo-de-caixa` | Resumo do mes · Entradas · Saidas · Saldo e runway · Premissas |
| `caixa/erp` | Sistema e ferramentas · Regime e obrigacoes · Processos · Pendencias |

### 8.4 Frontmatter inicial (seed) de TODOS os 11 arquivos

Estado logo apos o primeiro run do seeder (`status: empty`, corpo = so o H1 + os `##`
do template). `created`/`updated` recebem o timestamp do seed; `revision: 1`;
`last_edited_by: system`. Campos por-tipo comecam ausentes (adicionados ao preencher).

```yaml
# content/founder/objetivo.md
id: founder/objetivo
section: founder
entity: objetivo
title: "Objetivo"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 1
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "O que o founder quer alcancar com este negocio."
  write_policy: propose
```

```yaml
# content/founder/estilo-de-vida.md
id: founder/estilo-de-vida
section: founder
entity: estilo-de-vida
title: "Estilo de vida"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 2
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "A vida (tempo, renda, liberdade) que o negocio precisa sustentar."
  write_policy: founder_only
```

```yaml
# content/direcao/mapa-do-mercado.md
id: direcao/mapa-do-mercado
section: direcao
entity: mapa-do-mercado
title: "Mapa do mercado"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 1
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "O territorio onde o negocio joga."
  write_policy: propose
```

```yaml
# content/direcao/ima-de-problemas.md
id: direcao/ima-de-problemas
section: direcao
entity: ima-de-problemas
title: "Ima de problemas"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 2
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "Os problemas que atraem o founder e valem ser resolvidos."
  write_policy: propose
```

```yaml
# content/direcao/perfil-ideal-de-cliente.md
id: direcao/perfil-ideal-de-cliente
section: direcao
entity: perfil-ideal-de-cliente
title: "Perfil ideal de cliente"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 3
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "O ICP: para quem exatamente."
  write_policy: propose
```

```yaml
# content/direcao/tese-de-valor.md
id: direcao/tese-de-valor
section: direcao
entity: tese-de-valor
title: "Tese de valor"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 4
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "Por que esse cliente pagaria; a hipotese de valor."
  write_policy: propose
  related:
    - direcao/perfil-ideal-de-cliente
    - direcao/ima-de-problemas
```

```yaml
# content/direcao/oferta.md
id: direcao/oferta
section: direcao
entity: oferta
title: "Oferta (tese)"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 5
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "A oferta como intencao estrategica (versao direcao)."
  write_policy: propose
  related:
    - direcao/tese-de-valor
```

```yaml
# content/validacao/oferta.md
id: validacao/oferta
section: validacao
entity: oferta
title: "Oferta (validada)"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 1
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "A oferta como e testada/refinada em campo (versao validacao)."
  write_policy: propose
  related:
    - direcao/oferta
```

```yaml
# content/validacao/primeiros-clientes.md
id: validacao/primeiros-clientes
section: validacao
entity: primeiros-clientes
title: "Primeiros clientes"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 2
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "Os primeiros clientes reais e o aprendizado extraido deles."
  write_policy: propose
  related:
    - validacao/oferta
    - direcao/perfil-ideal-de-cliente
```

```yaml
# content/caixa/fluxo-de-caixa.md
id: caixa/fluxo-de-caixa
section: caixa
entity: fluxo-de-caixa
title: "Fluxo de caixa"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 1
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "Entradas e saidas ao longo do tempo."
  write_policy: propose
```

```yaml
# content/caixa/erp.md
id: caixa/erp
section: caixa
entity: erp
title: "ERP"
status: empty
summary: ""
tags: []
owner: ruanbraz@overlens.com.br
order: 2
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T00:00:00Z
revision: 1
last_edited_by: system
schema_version: 1
ai_context:
  purpose: "Documento de contexto sobre operacao/registro financeiro (nao modulo transacional)."
  write_policy: founder_only
```

---

## 9. Versao, `updated` e deteccao de conflito

O produto tem **duas camadas** de versionamento, complementares:

1. **Historico real = git.** `content/` e versionado por git (briefing: arquivos
   locais legiveis, versionaveis, sem lock-in). O historico completo, diffs e blame
   sao responsabilidade do git. Nao reimplementamos versionamento dentro do arquivo.
2. **Metadados leves no frontmatter** para a UI e para seguranca de concorrencia:
   - `updated` — timestamp ISO 8601 (com offset, ex.: `2026-07-11T14:32:00Z`).
     **Reescrito em toda escrita.** E o que o card exibe ("atualizado ha ...") e o
     que agentes usam para saber se um contexto esta fresco.
   - `created` — definido uma vez, nunca reescrito.
   - `revision` — inteiro monotonico, `+1` a cada escrita bem-sucedida. Usado para
     **deteccao de conflito otimista**.
   - `last_edited_by` — quem escreveu por ultimo (auditoria humano/agente).

**Formato de data:** canonico = ISO 8601 com offset. O escritor DEVE gravar timestamp
completo. Leitura tolera data-only (`YYYY-MM-DD`) por retrocompatibilidade, mas
normaliza para `T00:00:00Z` ao reescrever.

**Conflito otimista (essencial para multi-agente):** quem edita carrega o `revision`
que leu (`baseRevision`). No `writeEntity`, se o `revision` atual no disco != `baseRevision`,
a escrita **falha com `ConflictError`** — outro ator (founder ou outro agente) escreveu
no intervalo. O chamador (UI ou skill) re-le, reconcilia e tenta de novo. Isso evita
que um agente sobrescreva mudancas do founder silenciosamente.

---

## 10. Contrato de leitura/escrita (UI e agentes)

Um unico modulo — `lib/content/repository.ts` — e a **porta unica** de acesso a
`content/`. UI (via Server Actions / Route Handlers) e agentes/skills usam
exatamente as mesmas funcoes. Ninguem le/escreve o filesystem de conteudo por fora.

### 10.1 Resolucao de caminho

```
id "<section>/<entity>"  <->  content/<section>/<entity>.md
```

`sectionEnum` + slug validam a fronteira; qualquer `..`/path traversal e rejeitado.

### 10.2 Assinaturas

```ts
// lib/content/repository.ts
export async function readEntity(id: string): Promise<EntityDoc>;
export async function listEntities(section?: Section): Promise<EntityMeta[]>;
export async function writeEntity(input: WriteInput): Promise<EntityDoc>;

export interface WriteInput {
  id: string;
  editor: Editor;                       // 'founder' | 'system' | 'agent:<name>'
  baseRevision: number;                 // revision que o chamador leu (conflito)
  frontmatterPatch?: Partial<Frontmatter>; // campos a mesclar (sem tocar campos de sistema)
  body?: string;                        // corpo Markdown novo (se ausente, mantem)
}

export class ConflictError extends Error {}       // revision divergente
export class ValidationError extends Error {}      // falhou no Zod
export class PolicyError extends Error {}          // write_policy proibiu a escrita
export class NotInRegistryError extends Error {}   // id fora do REGISTRY
```

### 10.3 Algoritmo de `readEntity`

1. Verifica `id` no `REGISTRY`; senao `NotInRegistryError`.
2. Le o arquivo; parseia com `gray-matter` -> `{ data, content }`.
3. Valida `data` com `frontmatterSchema.and(ENTITY_EXTENSIONS[id])`; senao
   `ValidationError`.
4. Retorna `{ frontmatter, body: content, path }`.

### 10.4 Algoritmo de `writeEntity` (o coracao do contrato)

1. Resolve `id` no `REGISTRY` (`NotInRegistryError` se ausente).
2. Le o estado atual (se existir) -> `current`.
3. **Conflito:** se `current.revision !== input.baseRevision` -> `ConflictError`.
4. **Politica:** se `input.editor` comeca com `agent:` e
   `ai_context.write_policy === 'founder_only'` -> `PolicyError`.
5. Mescla frontmatter: `next = { ...current.frontmatter, ...input.frontmatterPatch }`.
6. **Campos controlados pelo sistema** (o chamador nao decide):
   - `updated = now()` (ISO 8601 UTC).
   - `revision = current.revision + 1`.
   - `last_edited_by = input.editor`.
   - `id`, `section`, `entity`, `created`, `schema_version` sao **imutaveis** —
     qualquer patch neles e ignorado/rejeitado.
7. **Fluxo de proposta:** se `editor` e agente e `write_policy === 'propose'`, força
   `next.status = 'needs_review'` (a menos que o proprio patch ja defina um status
   terminal permitido). Founder escreve com o status que quiser.
8. Corpo: usa `input.body` se veio; senao mantem o atual.
9. Valida `next` com Zod (`ValidationError` se falhar).
10. Serializa com `gray-matter.stringify`, **ordenando as chaves** na ordem canonica
    (secao 5, de cima para baixo; per-tipo ao final; `ai_context` por ultimo antes
    dos per-tipo) para diffs estaveis.
11. **Escrita atomica:** grava em arquivo temporario no mesmo diretorio e faz `rename`
    por cima (evita arquivo meio-escrito).
12. Retorna o `EntityDoc` resultante.

### 10.5 Como cada ator usa

- **UI (founder).** Form submit -> Server Action chama `writeEntity({ editor:
  'founder', baseRevision, frontmatterPatch, body })`. A UI carrega `baseRevision` do
  load da pagina; em `ConflictError`, mostra "o conteudo mudou, recarregue".
- **Agente/skill.** Le com `readEntity` (usando `ai_context.related` para montar
  contexto), escreve com `writeEntity({ editor: 'agent:<name>', baseRevision, ... })`.
  Sob `propose`, o resultado entra como `needs_review` e o founder aprova pela UI
  (mudando `status` para `validated`/`in_progress` num novo `writeEntity` do founder).
- **Seeder/migracao.** `editor: 'system'`; cria arquivos ausentes do `REGISTRY` com o
  frontmatter da secao 8.4.

### 10.6 Bibliotecas

`gray-matter` (parse/stringify frontmatter), `zod` (validacao), `js-yaml` (via
gray-matter). Sem dependencias alem dos defaults. Nada de banco.

---

## 11. Como um card mapeia para um arquivo

Relacao **1:1 e projetiva**: o card e uma *view* do arquivo, nunca uma copia
independente.

```
content/<section>/<entity>.md
        │  readEntity / listEntities
        ▼
     EntityMeta  ──►  <EntityCard/>   (na pagina /<section>)
        │  click
        ▼
     EntityDoc  ──►  <EntityForm/>    (na pagina /<section>/<entity>, editavel)
        │  submit -> Server Action -> writeEntity
        ▼
content/<section>/<entity>.md  (mesmo arquivo, revision+1, updated=now)
```

- **Pagina da secao** (`/<section>`) faz `listEntities(section)`, ordena por `order`
  asc e renderiza um card por `EntityMeta`. O **toggle grid/lista** (um `select`) so
  troca o layout; os dados do card sao os mesmos.
- **Campos que o card exibe:** `title`, `summary`, `status` (badge com rotulo pt-BR),
  `updated` (relativo), `tags`. `last_edited_by` pode virar um selo "proposto por IA"
  quando `status === 'needs_review'`.
- **Detalhe/edicao** (`/<section>/<entity>`) carrega o `EntityDoc` completo e monta o
  formulario a partir do frontmatter (campos core + por-tipo) e do corpo (por
  headings do template).
- **Sem card orfao / sem arquivo orfao:** a lista de cards vem do `REGISTRY`, entao
  toda entidade canonica sempre tem card (mesmo `status: empty`) e todo card sempre
  aponta para um arquivo existente (o seeder garante).

---

## 12. Exemplos completos de arquivo MD (um por secao)

### 12.1 `content/founder/objetivo.md` (secao founder)

```markdown
---
id: founder/objetivo
section: founder
entity: objetivo
title: "Objetivo"
status: in_progress
summary: "Construir um negocio de software que sustente o founder em ate 12 meses, com receita recorrente previsivel."
tags: [objetivo, norte]
owner: ruanbraz@overlens.com.br
order: 1
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T14:20:00Z
revision: 4
last_edited_by: founder
schema_version: 1
ai_context:
  purpose: "O que o founder quer alcancar com este negocio."
  write_policy: propose
  read_when:
    - "Antes de propor tese de valor ou oferta, para alinhar ambicao e horizonte."
time_horizon: "12m"
north_star_metric: "MRR"
---

# Objetivo

## Objetivo principal
Construir um negocio de software B2B que gere **receita recorrente previsivel** e
sustente o founder em tempo integral dentro de 12 meses.

## Por que agora
O founder tem contexto de mercado fresco e uma janela de dedicacao integral nos
proximos 12 meses. Custo de oportunidade e alto se nao focar agora.

## Como sabemos que chegamos
- MRR cobrindo o custo de vida-alvo (ver `founder/estilo-de-vida`).
- Pelo menos 10 clientes pagantes recorrentes.

## Restricoes
- Sem captar investimento nesta fase (bootstrap).
- Manter carga de trabalho sustentavel (ver estilo de vida).
```

### 12.2 `content/direcao/tese-de-valor.md` (secao direcao)

```markdown
---
id: direcao/tese-de-valor
section: direcao
entity: tese-de-valor
title: "Tese de valor"
status: needs_review
summary: "Founders solo perdem contexto entre ferramentas; um OS de decisao em MD que humanos e IA compartilham reduz esse atrito."
tags: [valor, hipotese, contexto]
owner: ruanbraz@overlens.com.br
order: 4
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T15:02:00Z
revision: 2
last_edited_by: agent:direcao-strategist
schema_version: 1
ai_context:
  purpose: "Por que esse cliente pagaria; a hipotese de valor."
  write_policy: propose
  related:
    - direcao/perfil-ideal-de-cliente
    - direcao/ima-de-problemas
  instructions: "Ancore a tese nas dores listadas em ima-de-problemas; nao invente segmentos fora do ICP."
hypothesis: "Reduzir fragmentacao de contexto vale pagamento recorrente para founders solo."
confidence: medium
---

# Tese de valor

## Hipotese
Founders solo pagam por uma superficie unica onde o estado do negocio vive como
contexto estruturado, compartilhado entre eles e a IA.

## Para quem
Ver `direcao/perfil-ideal-de-cliente`: founder solo, estagio ideia -> primeiros
clientes, ja trabalha com IA.

## Por que pagariam
Elimina retrabalho de re-explicar contexto e da clareza diaria do "estado atual".

## Evidencias
- Dores recorrentes em `direcao/ima-de-problemas` (fragmentacao, re-contexto).
- Conversas exploratorias iniciais (a validar em `validacao/`).

## Riscos da tese
- Founders podem tolerar a dor por ser "de graca" hoje.
- Disposicao a pagar ainda nao comprovada — depende de `validacao/oferta`.
```

### 12.3 `content/validacao/primeiros-clientes.md` (secao validacao)

```markdown
---
id: validacao/primeiros-clientes
section: validacao
entity: primeiros-clientes
title: "Primeiros clientes"
status: in_progress
summary: "3 founders testando o beta; 1 ja paga mensal. Principal aprendizado: onboarding do contexto inicial e o gargalo."
tags: [validacao, clientes, aprendizado]
owner: ruanbraz@overlens.com.br
order: 2
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T16:40:00Z
revision: 6
last_edited_by: founder
schema_version: 1
ai_context:
  purpose: "Os primeiros clientes reais e o aprendizado extraido deles."
  write_policy: propose
  related:
    - validacao/oferta
    - direcao/perfil-ideal-de-cliente
  read_when:
    - "Ao sintetizar aprendizado de campo ou ajustar o ICP."
customers_count: 3
paying_count: 1
---

# Primeiros clientes

## Clientes
- **C1** — founder solo, SaaS nichado. Pagante mensal.
- **C2** — consultora virando produto. Beta gratuito.
- **C3** — founder tecnico. Beta gratuito.

## Como chegaram
Rede pessoal do founder + indicacao de C1.

## O que compraram
C1 assinou o plano mensal apos usar `direcao` e `caixa` por duas semanas.

## Aprendizados
- Onboarding do **contexto inicial** e o maior gargalo — seed vazio assusta.
- Cards com `status` deram sensacao imediata de "estado do negocio".
- Pedido recorrente: agente que preenche o primeiro rascunho.

## Proximos passos
- Reduzir atrito do primeiro preenchimento (skill de seed assistido).
- Converter C2 e C3 apos melhorar onboarding.
```

### 12.4 `content/caixa/fluxo-de-caixa.md` (secao caixa)

```markdown
---
id: caixa/fluxo-de-caixa
section: caixa
entity: fluxo-de-caixa
title: "Fluxo de caixa"
status: validated
summary: "Julho/2026: entradas R$ 1.200, saidas R$ 3.800, saldo negativo; runway ~8 meses com a reserva atual."
tags: [caixa, financeiro, runway]
owner: ruanbraz@overlens.com.br
order: 1
created: 2026-07-11T00:00:00Z
updated: 2026-07-11T17:05:00Z
revision: 3
last_edited_by: founder
schema_version: 1
ai_context:
  purpose: "Entradas e saidas ao longo do tempo."
  write_policy: propose
  instructions: "Documento de contexto, nao razao contabil. Nao lancar transacoes; resumir e projetar."
currency: "BRL"
net_month: -2600
runway_months: 8
---

# Fluxo de caixa

## Resumo do mes
Julho/2026 fecha negativo em **R$ 2.600**. Esperado nesta fase (pre-receita
recorrente).

## Entradas
- Assinatura C1: **R$ 1.200**.

## Saidas
- Infra e ferramentas: R$ 800.
- Pro-labore minimo: R$ 3.000.

## Saldo e runway
- Saldo do mes: **-R$ 2.600**.
- Runway estimado: **~8 meses** com a reserva atual.

## Premissas
- Sem novas entradas ate converter C2/C3.
- Custos fixos estaveis; sem contratacoes.
```

---

## 13. Regras de validacao e invariantes

Verificadas por `frontmatterSchema` + checagens do repositorio:

1. `id === "<section>/<entity>"` e igual ao caminho relativo do arquivo (sem
   `content/`, sem `.md`).
2. `section` pertence a `Section`; `entity` casa `^[a-z0-9-]+$`.
3. `id` pertence ao `REGISTRY` (arquivos fora do registro sao ignorados com aviso).
4. Todos os campos core (secao 5) presentes e com tipos validos.
5. `status` pertence a `Status`; `ai_context.write_policy` a `WritePolicy`.
6. `revision >= 1`, inteiro, monotonico crescente ao longo das escritas.
7. `created` imutavel; `updated >= created`.
8. `owner` e email valido.
9. `last_edited_by` casa `^(founder|system|agent:[a-z0-9-]+)$`.
10. `schema_version === 1`.
11. Campos por-tipo, quando presentes, respeitam a extensao do `id` (secao 8.2).
12. Corpo comeca com `#` H1 (recomendado igual ao `title`).
13. Campos de sistema (`id`, `section`, `entity`, `created`, `revision`,
    `updated`, `last_edited_by`, `schema_version`) nunca sao definidos diretamente
    pelo chamador de `writeEntity` — o repositorio os controla.

---

## 14. Dependencias a jusante

Este doc e o contrato para:

- **Arquitetura & stack** (`docs/01+`) — deve situar `content/`, `lib/content/`
  (`schema.ts`, `registry.ts`, `repository.ts`) na estrutura Next.js e amarrar o
  seeder ao primeiro run. O mapeamento deste modelo para Supabase **ja foi feito** (ADR
  0001): a tabela `content_entities` espelha o `frontmatter` (jsonb) + `body`, uma copia
  por usuario, sem mudar o contrato de dominio. Ver `docs/04` §11.
- **Design system / UI** — `EntityCard`, `EntityForm`, badges de `status` (rotulos
  6.2), toggle grid/lista; consome `EntityMeta`/`EntityDoc` (secao 7).
- **Especificacao de agentes & skills** — usa `readEntity`/`writeEntity`,
  `ai_context` (`purpose`/`read_when`/`related`/`write_policy`) e o fluxo
  `propose -> needs_review -> founder aprova` (secao 10).
```