---
doc: prd
title: PRD do BusinessOS
status: derivado
versao: 1.0.0
owner: ruanbraz@overlens.com.br
atualizado_em: 2026-07-11
depende_de: [docs/00-briefing.md]
tags: [prd, requisitos, escopo, user-stories, criterios-de-aceitacao, mvp]
---

# BusinessOS — Product Requirements Document (PRD)

> **Documento derivado do briefing canonico** (`docs/00-briefing.md`). Em caso de conflito, o briefing prevalece. Este PRD traduz a visao do briefing em requisitos concretos, implementaveis e testaveis: objetivos, personas, user stories, requisitos funcionais, especificacao pagina-a-pagina das 4 secoes, estados, criterios de aceitacao, recorte de MVP e metricas de sucesso.

---

## 1. Contexto e Proposito do Documento

O BusinessOS e um **sistema operacional de tomada de decisao** para o founder que comeca do zero. E, ao mesmo tempo, **um web app** (onde o founder edita o negocio por formularios) e **a inteligencia viva do negocio** (cada informacao vira um arquivo Markdown com frontmatter YAML, que agentes de IA e skills leem e escrevem).

Este PRD existe para:

- Fixar **o que** o produto deve fazer (nao **como** — arquitetura e design system tem docs proprios).
- Servir de contrato de aceitacao para implementacao e QA.
- Definir a fronteira **MVP vs depois**, para evitar escopo crescer sem controle.

**Fora do escopo deste doc (delegado a docs subsequentes):**
- Arquitetura, estrutura de pastas e plano de persistencia -> doc de arquitetura.
- Schema exato de frontmatter por entidade -> doc de modelo de dados / especificacao de conteudo.
- Tokens visuais, componentes e Storybook -> doc de design system.
- Fluxo detalhado de agentes/skills -> doc de especificacao de agentes.

---

## 2. Objetivos e Nao-Objetivos

### 2.1 Objetivos (o que o produto precisa alcancar)

| # | Objetivo | Por que importa |
|---|---|---|
| O1 | **Ida e volta em arquivo.** Editar uma entidade por formulario, salvar, e persistir corretamente em `content/<secao>/<entidade>.md` (frontmatter + corpo); reabrir a UI reflete o arquivo. | E a tese central: um artefato serve humano e maquina. |
| O2 | **As 4 secoes navegaveis.** Sidebar com `founder`, `direcao`, `validacao`, `caixa`; cada uma abre sua pagina de cards com as entidades certas. | Estrutura mental do produto. |
| O3 | **Cards com toggle grid/lista** via um unico controle select. | Requisito de exibicao fixado no briefing. |
| O4 | **Contrato de contexto legivel.** Qualquer MD abre num editor/agente e comunica o estado da entidade (frontmatter valido + headings claros) sem contexto extra. | Viabiliza colaboracao multi-agente barata. |
| O5 | **Leitura/escrita por agentes.** Agentes e skills leem e escrevem os mesmos arquivos que a UI, respeitando o mesmo formato. | Colaboracao humano+IA de primeira classe. |
| O6 | **Fidelidade ao design.** Minimalista preto & branco, Inter, cantos arredondados, hover na sidebar; componentizado (Storybook). | Consistencia e foco. |
| O7 | **Zero dependencia de banco.** Tudo funciona so com filesystem local. | Propriedade dos dados, sem lock-in. |

### 2.2 Nao-Objetivos (explicitamente fora — nesta fase)

- **Sem banco de dados conectado.** Persistencia = arquivos MD locais em `content/`. Supabase apenas documentado como futuro, nunca implementado agora.
- **Sem autenticacao / multiusuario.** Produto single-founder local.
- **Sem tabelas** como padrao de exibicao — cards sempre.
- **Sem ERP/CRM transacional.** `erp` e `fluxo-de-caixa` sao documentos de contexto, nao modulos com lancamentos operacionais.
- **Sem execucao autonoma sem revisao.** Agentes propoem; o founder aprova via UI.
- **Sem escalar a stack alem dos defaults.** Nada de bibliotecas de estado pesadas, GraphQL, microservicos, realtime.
- **Sem internacionalizacao.** pt-BR unico (identificadores tecnicos permanecem em ingles).
- **Sem colaboracao em tempo real / merge concorrente.** Uma sessao de edicao por vez (ver R-EDIT-07, conflito).

---

## 3. Personas

### 3.1 Persona primaria — Bruno, o Founder do Zero

- **Contexto:** esta entre a ideia e os primeiros clientes; decide quase tudo sozinho ou em time minusculo.
- **Dores:** contexto fragmentado (cabeca, planilhas, notas, chats); sem "estado atual" claro do negocio; IA que esquece o contexto a cada conversa.
- **Objetivos:** clareza e progresso, nao burocracia; um lugar so para a verdade do negocio; trabalhar lado a lado com IA que ja conhece o contexto.
- **Comportamento:** valoriza minimalismo e foco; espera um fluxo que espelhe a construcao real (`founder` -> `direcao` -> `validacao` -> `caixa`).
- **Criterio de sucesso pessoal:** abrir o app e, em segundos, ver e ajustar o estado atual do negocio; pedir ajuda a um agente sem re-explicar o basico.

### 3.2 Persona secundaria — Agente/Skill (colaborador nao-humano)

- **O que e:** processo de IA ou capacidade reutilizavel que opera sobre `content/`.
- **Necessidades:** ler MD para obter contexto estruturado (frontmatter) e narrativo (corpo); escrever de volta atualizacoes validas no mesmo formato que a UI espera.
- **Restricoes:** nunca aplica mudanca "final" sem que o founder possa revisar/aprovar via UI; deve preservar a validade do frontmatter e a estrutura de headings.
- **Exemplo de fluxo:** um agente de `direcao` le `mapa-do-mercado` + `perfil-ideal-de-cliente` e propoe um rascunho de `tese-de-valor`.

> Persona secundaria e tratada como **usuario de primeira classe** do produto, nao um plugin lateral. Os requisitos de formato (R-FM-*) existem para servir a ela tanto quanto ao humano.

---

## 4. User Stories por Secao

Formato: *Como [persona], quero [acao], para [valor].*

### 4.1 Transversais (todas as secoes)

- **US-G1** — Como founder, quero ver as 4 secoes na sidebar e navegar entre elas com um clique, para acessar cada area do negocio rapidamente.
- **US-G2** — Como founder, quero abrir uma secao e ver suas entidades como cards, para entender de relance o estado daquela area.
- **US-G3** — Como founder, quero alternar a exibicao dos cards entre grid e lista por um unico select, para escolher a densidade de leitura.
- **US-G4** — Como founder, quero abrir um card e editar seus campos num formulario, para atualizar o negocio sem tocar em arquivos manualmente.
- **US-G5** — Como founder, quero salvar e ver a confirmacao de que o arquivo foi gravado, para confiar que o estado ficou persistido.
- **US-G6** — Como founder, quero que cada card mostre seu status (rascunho / em-progresso / validado) e a data de atualizacao, para saber o que ja esta maduro e o que falta.
- **US-G7** — Como agente, quero ler o MD de uma entidade e obter frontmatter + corpo, para agir com o contexto atual sem re-explicacao.
- **US-G8** — Como agente, quero escrever de volta uma atualizacao valida num MD, para que o founder a revise na UI sem que nada quebre.

### 4.2 Secao `founder` — *Quem esta construindo e por que*

- **US-F1** — Como founder, quero registrar meu **objetivo** com o negocio, para ancorar toda decisao ao que eu realmente quero alcancar.
- **US-F2** — Como founder, quero descrever o **estilo-de-vida** que o negocio precisa sustentar (tempo, renda, liberdade), para que as decisoes respeitem minhas restricoes e aspiracoes.
- **US-F3** — Como agente, quero ler `objetivo` e `estilo-de-vida`, para calibrar propostas de direcao/oferta ao que faz sentido para este founder.

### 4.3 Secao `direcao` — *Para onde o negocio aponta*

- **US-D1** — Como founder, quero registrar o **mapa-do-mercado** (o territorio onde jogo), para situar o negocio.
- **US-D2** — Como founder, quero descrever o **ima-de-problemas** (problemas que valem ser resolvidos), para focar no que atrai valor.
- **US-D3** — Como founder, quero definir o **perfil-ideal-de-cliente** (ICP), para saber para quem exatamente construo.
- **US-D4** — Como founder, quero formular a **tese-de-valor** (por que esse cliente pagaria), para ter a hipotese central explicita.
- **US-D5** — Como founder, quero registrar a **oferta** como intencao estrategica (versao direcao), para expressar minha aposta antes de testar.
- **US-D6** — Como agente, quero ler `mapa-do-mercado` + `perfil-ideal-de-cliente` e propor rascunho de `tese-de-valor`, para acelerar a definicao de direcao.

### 4.4 Secao `validacao` — *O que ja foi testado com a realidade*

- **US-V1** — Como founder, quero registrar a **oferta** como ela e testada/refinada em campo (versao validacao, arquivo distinto da oferta de direcao), para separar tese de evidencia.
- **US-V2** — Como founder, quero documentar os **primeiros-clientes** reais e o aprendizado extraido, para consolidar evidencia de validacao.
- **US-V3** — Como agente, quero sintetizar aprendizados de `primeiros-clientes` e sugerir ajustes na `oferta` (validacao), para fechar o loop tese->evidencia.

### 4.5 Secao `caixa` — *Como o dinheiro entra e se move*

- **US-C1** — Como founder, quero registrar o **fluxo-de-caixa** (entradas e saidas ao longo do tempo) como documento de contexto, para trazer a realidade financeira ao mesmo lugar.
- **US-C2** — Como founder, quero manter o **erp** como documento de contexto sobre operacao/registro financeiro (nao um modulo transacional), para que agentes entendam como o negocio se organiza financeiramente.
- **US-C3** — Como agente, quero ler `fluxo-de-caixa` e `erp` para relacionar decisoes de `direcao`/`validacao` com a realidade de caixa.

---

## 5. Requisitos Funcionais

Prioridade: **P0** = MVP obrigatorio; **P1** = desejavel no MVP se couber; **P2** = depois.

### 5.1 Navegacao e estrutura (NAV)

| ID | Prioridade | Requisito |
|---|---|---|
| R-NAV-01 | P0 | A sidebar lista exatamente 4 itens de secao, na ordem: `founder`, `direcao`, `validacao`, `caixa`. |
| R-NAV-02 | P0 | Clicar num item de secao navega para a pagina de cards daquela secao. |
| R-NAV-03 | P0 | Itens de sidebar tem estado de **hover com background** e indicam a secao ativa. |
| R-NAV-04 | P0 | Rota por secao (ex.: `/founder`, `/direcao`, `/validacao`, `/caixa`); rota por entidade para edicao (ex.: `/direcao/tese-de-valor`). |
| R-NAV-05 | P1 | A pagina inicial (`/`) redireciona ou apresenta atalho para `founder` (primeira secao do fluxo). |

### 5.2 Pagina de cards e exibicao (CARD)

| ID | Prioridade | Requisito |
|---|---|---|
| R-CARD-01 | P0 | Cada secao renderiza suas entidades como **cards** (nunca tabela). |
| R-CARD-02 | P0 | Cada card exibe no minimo: **titulo** da entidade, **status** (rascunho/em-progresso/validado) e **data de atualizacao** (`atualizado_em`). |
| R-CARD-03 | P0 | Toggle de visualizacao **grid/lista** via **um unico controle select** por pagina de secao. |
| R-CARD-04 | P0 | Em modo **grid**, cards ficam em grade responsiva; em modo **lista**, empilhados em largura total. Conteudo minimo do card e o mesmo nos dois modos. |
| R-CARD-05 | P1 | A preferencia grid/lista persiste entre navegacoes na sessao (ex.: por secao). Persistir entre sessoes e P2. |
| R-CARD-06 | P0 | Clicar num card abre a tela/painel de edicao da entidade correspondente. |
| R-CARD-07 | P1 | Card exibe uma previa curta derivada do corpo ou de um campo de resumo do frontmatter, quando existir. |
| R-CARD-08 | P0 | Entidades sao descobertas a partir dos arquivos existentes em `content/<secao>/`; a ausencia de um arquivo esperado e tratada como card em estado "vazio/nao iniciado" (ver R-STATE-05). |

### 5.3 Edicao e salvamento (EDIT)

| ID | Prioridade | Requisito |
|---|---|---|
| R-EDIT-01 | P0 | Cada entidade tem um **formulario** de edicao com campos para os metadados de frontmatter e para o corpo em Markdown. |
| R-EDIT-02 | P0 | **Salvar** grava o arquivo `content/<secao>/<entidade>.md` com frontmatter YAML valido + corpo Markdown, sobrescrevendo o anterior. |
| R-EDIT-03 | P0 | Ao salvar, `atualizado_em` e definido para a data atual automaticamente. |
| R-EDIT-04 | P0 | Apos salvar, a UI confirma sucesso (feedback visivel) e, ao reabrir, o formulario/card reflete fielmente o arquivo em disco. |
| R-EDIT-05 | P0 | Criar uma entidade ainda inexistente cria o arquivo (e o diretorio da secao, se preciso) na primeira gravacao. |
| R-EDIT-06 | P0 | Salvar so e permitido com frontmatter valido (campos obrigatorios presentes e `status` dentro do enum). Erros de validacao sao mostrados no formulario e bloqueiam a gravacao. |
| R-EDIT-07 | P1 | Deteccao basica de conflito: se o arquivo em disco mudou desde que foi carregado (ex.: um agente escreveu), avisar antes de sobrescrever. (Merge automatico e P2.) |
| R-EDIT-08 | P1 | Cancelar edicao descarta mudancas nao salvas sem alterar o arquivo. |
| R-EDIT-09 | P2 | Historico/versionamento na UI (alem do git no filesystem). |

### 5.4 Frontmatter e contrato de contexto (FM)

> O **schema exato por entidade** e do doc de modelo de dados. Aqui fixamos o **contrato minimo** que a UI e os agentes compartilham.

| ID | Prioridade | Requisito |
|---|---|---|
| R-FM-01 | P0 | Todo MD comeca com bloco YAML entre `---`, seguido do corpo Markdown. |
| R-FM-02 | P0 | Campos base presentes em toda entidade: `secao`, `entidade`, `titulo`, `status`, `atualizado_em`, `tags`. |
| R-FM-03 | P0 | `status` aceita apenas: `rascunho`, `em-progresso`, `validado` (mapeamento dos estados draft / in-progress / done — ver secao 7). |
| R-FM-04 | P0 | `secao` e `entidade` no frontmatter correspondem ao caminho do arquivo (`content/<secao>/<entidade>.md`). |
| R-FM-05 | P0 | O corpo usa **headings claros**; cada entidade tem um conjunto recomendado de secoes (ver requisitos pagina-a-pagina). |
| R-FM-06 | P0 | O formato de escrita da UI e identico ao esperado na leitura por agentes: mesmo layout de frontmatter, mesmas chaves. |
| R-FM-07 | P1 | Campos ausentes opcionais nao quebram a renderizacao; a UI degrada com elegancia (mostra placeholder / estado vazio). |
| R-FM-08 | P1 | Um resumo curto opcional (ex.: `resumo`) no frontmatter alimenta a previa do card (R-CARD-07). |

### 5.5 Acesso de leitura/escrita por agentes (AG)

| ID | Prioridade | Requisito |
|---|---|---|
| R-AG-01 | P0 | Os arquivos em `content/` sao a **fonte unica** de contexto compartilhado; nao ha copia paralela do estado em outro formato. |
| R-AG-02 | P0 | Um agente consegue **ler** qualquer MD e obter frontmatter + corpo sem API proprietaria (basta ler o arquivo). |
| R-AG-03 | P0 | Um agente consegue **escrever** de volta um MD valido (mesmo formato da UI) que a UI renderiza sem quebrar. |
| R-AG-04 | P0 | O founder permanece no controle: mudancas propostas por agente sao **revisadas/aprovadas via UI** (agente propoe, humano aprova). Sem execucao autonoma "final". |
| R-AG-05 | P1 | Mudancas por agente sao **auditaveis** (legiveis em diff de texto; frontmatter e corpo em texto plano). |
| R-AG-06 | P2 | Marcacao de origem da ultima edicao (ex.: `origem: agente|founder`) para diferenciar autoria na UI. |

---

## 6. Requisitos Pagina-a-Pagina (4 Secoes e Entidades)

Convencao: cada entidade = 1 card = 1 arquivo `content/<secao>/<entidade>.md`. As "secoes do corpo" abaixo sao o conjunto **recomendado de headings** (contrato de legibilidade R-FM-05); o schema formal fica no doc de dados.

### 6.1 Secao `founder` — rota `/founder`

Cards exibidos: `objetivo`, `estilo-de-vida`.

| Entidade | Arquivo | Proposito | Secoes recomendadas do corpo |
|---|---|---|---|
| **objetivo** | `content/founder/objetivo.md` | O que o founder quer alcancar com o negocio. | `## Objetivo`, `## Motivacao`, `## Horizonte de tempo`, `## Como saberei que cheguei` |
| **estilo-de-vida** | `content/founder/estilo-de-vida.md` | A vida que o negocio precisa sustentar. | `## Tempo`, `## Renda`, `## Liberdade`, `## Restricoes inegociaveis` |

### 6.2 Secao `direcao` — rota `/direcao`

Cards exibidos: `mapa-do-mercado`, `ima-de-problemas`, `perfil-ideal-de-cliente`, `tese-de-valor`, `oferta`.

| Entidade | Arquivo | Proposito | Secoes recomendadas do corpo |
|---|---|---|---|
| **mapa-do-mercado** | `content/direcao/mapa-do-mercado.md` | O territorio onde o negocio joga. | `## Territorio`, `## Players`, `## Tendencias`, `## Onde entramos` |
| **ima-de-problemas** | `content/direcao/ima-de-problemas.md` | Problemas que atraem o founder / valem resolver. | `## Problemas`, `## Por que me atraem`, `## Quem sente a dor` |
| **perfil-ideal-de-cliente** | `content/direcao/perfil-ideal-de-cliente.md` | O ICP: para quem exatamente. | `## Quem e`, `## Contexto`, `## Dores`, `## Onde encontrar` |
| **tese-de-valor** | `content/direcao/tese-de-valor.md` | Por que esse cliente pagaria (hipotese). | `## Hipotese`, `## Evidencias`, `## Riscos da tese` |
| **oferta** (direcao) | `content/direcao/oferta.md` | A oferta como intencao estrategica (tese). | `## Oferta`, `## Promessa`, `## Preco (hipotese)`, `## Como entregamos` |

### 6.3 Secao `validacao` — rota `/validacao`

Cards exibidos: `oferta`, `primeiros-clientes`.

| Entidade | Arquivo | Proposito | Secoes recomendadas do corpo |
|---|---|---|---|
| **oferta** (validacao) | `content/validacao/oferta.md` | A oferta como testada/refinada em campo (evidencia validada). **Arquivo distinto** da `oferta` de direcao. | `## Oferta testada`, `## O que mudou vs tese`, `## Sinais de validacao`, `## Proximo teste` |
| **primeiros-clientes** | `content/validacao/primeiros-clientes.md` | Primeiros clientes reais e aprendizado. | `## Clientes`, `## Como chegaram`, `## Aprendizados`, `## Objecoes` |

> **Regra da `oferta` duplicada (R-OFERTA):** `direcao/oferta.md` (tese) e `validacao/oferta.md` (evidencia validada) sao **dois arquivos independentes**. A UI trata cada um no contexto da sua secao; nao ha sincronizacao automatica entre eles no MVP. Agentes podem relacionar os dois, mas cada gravacao atinge apenas o arquivo da sua secao.

### 6.4 Secao `caixa` — rota `/caixa`

Cards exibidos: `fluxo-de-caixa`, `erp`.

| Entidade | Arquivo | Proposito | Secoes recomendadas do corpo |
|---|---|---|---|
| **fluxo-de-caixa** | `content/caixa/fluxo-de-caixa.md` | Entradas e saidas ao longo do tempo (documento de contexto, nao modulo transacional). | `## Entradas`, `## Saidas`, `## Saldo e tendencia`, `## Premissas` |
| **erp** | `content/caixa/erp.md` | Contexto sobre operacao/registro financeiro. | `## Como registramos`, `## Ferramentas`, `## Rotina financeira`, `## Pendencias` |

> `caixa` e explicitamente **contexto**, nao lancamentos operacionais. Nao ha tela de lancamento, conciliacao ou relatorio contabil no MVP.

---

## 7. Estados da Entidade (draft / in-progress / done)

Cada entidade tem exatamente um `status` no frontmatter. Os identificadores conceituais (ingles) mapeiam para os valores persistidos (pt-BR):

| Conceito | Valor no frontmatter | Significado | Sinal na UI |
|---|---|---|---|
| draft | `rascunho` | Iniciado, ainda incompleto ou nao confiavel. | Badge neutro (P&B). |
| in-progress | `em-progresso` | Em desenvolvimento ativo; conteudo util mas ainda evoluindo. | Badge de progresso. |
| done | `validado` | Maduro/estavel para a fase atual (para `validacao`, significa confirmado com a realidade). | Badge de concluido. |

Requisitos de estado:

| ID | Prioridade | Requisito |
|---|---|---|
| R-STATE-01 | P0 | Toda entidade persistida tem `status` valido (um dos tres). |
| R-STATE-02 | P0 | O card exibe o status visualmente (badge minimalista P&B). |
| R-STATE-03 | P0 | O status e editavel no formulario (controle de selecao). |
| R-STATE-04 | P1 | Filtrar/ordenar cards por status na pagina de secao. |
| R-STATE-05 | P1 | Entidade sem arquivo aparece como card **"nao iniciado"** (estado derivado, nao persistido) com acao de "criar". Ao criar, nasce como `rascunho`. |
| R-STATE-06 | P2 | Transicoes de status sugeridas por agente (ex.: agente marca `em-progresso` ao preencher um rascunho), sempre sujeitas a aprovacao (R-AG-04). |

---

## 8. Criterios de Aceitacao

Cada criterio e verificavel de forma binaria. Deriva dos criterios de sucesso do briefing (secao 10).

### 8.1 Navegacao e secoes
- **CA-01** — A sidebar mostra `founder`, `direcao`, `validacao`, `caixa`, nessa ordem, com hover background e indicacao de ativa.
- **CA-02** — Clicar em cada secao abre sua pagina de cards com exatamente as entidades especificadas na secao 6 (nem mais, nem menos).

### 8.2 Cards e toggle
- **CA-03** — Cada card mostra titulo, status e data de atualizacao.
- **CA-04** — Um unico select alterna grid/lista; ambos os modos renderizam o mesmo conteudo minimo do card sem erro.

### 8.3 Ida e volta em arquivo (O1)
- **CA-05** — Editar uma entidade no formulario e salvar cria/atualiza `content/<secao>/<entidade>.md` com frontmatter YAML valido + corpo.
- **CA-06** — `atualizado_em` reflete a data do salvamento.
- **CA-07** — Reabrir a UI (recarregar) mostra fielmente o que esta no arquivo; nenhum campo se perde no round-trip.
- **CA-08** — Tentar salvar com `status` fora do enum ou campo obrigatorio ausente e bloqueado com mensagem de erro no formulario.

### 8.4 Contrato de contexto e agentes
- **CA-09** — Abrir qualquer MD gerado num editor de texto mostra frontmatter valido e headings claros, compreensivel sem contexto extra.
- **CA-10** — Um agente/skill le um MD de contexto e escreve de volta uma atualizacao valida; ao recarregar, a UI renderiza a mudanca sem quebrar (card e formulario intactos).
- **CA-11** — Nao existe copia do estado fora de `content/`; a UI e editor dos arquivos, nao espelho de outro banco.

### 8.5 Oferta duplicada
- **CA-12** — Editar `direcao/oferta` nao altera `validacao/oferta` e vice-versa; sao arquivos independentes.

### 8.6 Design e sem-banco
- **CA-13** — UI e minimalista P&B, fonte Inter, cantos arredondados; componentes visiveis no Storybook.
- **CA-14** — O produto funciona de ponta a ponta sem nenhum banco conectado; nao ha chamada a Supabase/Postgres em runtime.

---

## 9. MVP vs Depois

### 9.1 No MVP (P0 — precisa estar pronto)

- Sidebar com as 4 secoes + navegacao (R-NAV-01..04).
- Paginas de cards para as 4 secoes com todas as entidades da secao 6 (R-CARD-01,02,06,08).
- Toggle grid/lista via um select (R-CARD-03,04).
- Formulario de edicao por entidade (frontmatter + corpo) com validacao (R-EDIT-01,06).
- Salvar/gravar MD com round-trip fiel e `atualizado_em` automatico (R-EDIT-02..05; O1).
- Contrato de frontmatter base + headings (R-FM-01..06).
- Leitura/escrita por agentes sobre `content/` como fonte unica, com aprovacao do founder (R-AG-01..04).
- Estados rascunho/em-progresso/validado exibidos e editaveis (R-STATE-01..03).
- Design P&B, Inter, cantos arredondados, hover na sidebar, Storybook (O6).
- Zero dependencia de banco (O7).

### 9.2 Depois (P1/P2 — nao bloqueia o MVP)

- Persistencia da preferencia grid/lista entre sessoes (R-CARD-05).
- Previa/resumo no card via campo de frontmatter (R-CARD-07, R-FM-08).
- Deteccao de conflito de edicao (agente vs founder) e merge (R-EDIT-07; R-EDIT-09).
- Filtro/ordenacao por status; estado "nao iniciado" com acao criar (R-STATE-04,05).
- Auditoria/origem da edicao na UI (R-AG-05,06; R-STATE-06).
- Cancelar com descarte explicito (R-EDIT-08).
- **Supabase como camada de persistencia** — apenas **documentado**, implementacao e fase futura fora deste PRD.
- Internacionalizacao, autenticacao, multiusuario, realtime — fora de escopo previsivel.

---

## 10. Metricas de Sucesso

### 10.1 Metricas de produto (sinais de que a visao se cumpre)

| Metrica | Definicao | Alvo MVP |
|---|---|---|
| **Cobertura de contexto** | % das entidades das 4 secoes com arquivo criado e `status` != vazio. | >= 80% das 11 entidades preenchidas em uso real. |
| **Round-trip fiel** | % de salvamentos em que reabrir a UI reflete 100% do arquivo. | 100% (sem perda de campos). |
| **Maturidade** | % de entidades em `em-progresso` ou `validado`. | Crescente ao longo do uso; sem alvo fixo no MVP. |
| **Colaboracao demonstravel** | Existe ao menos 1 fluxo real em que agente le um MD e escreve atualizacao valida aprovada pelo founder. | >= 1 fluxo funcionando. |

### 10.2 Metricas de qualidade / engenharia

| Metrica | Definicao | Alvo |
|---|---|---|
| **Validade de frontmatter** | % de arquivos em `content/` com frontmatter valido (parseavel, campos base, status no enum). | 100%. |
| **Integridade caminho<->frontmatter** | % de arquivos em que `secao`/`entidade` batem com o caminho. | 100%. |
| **Zero-banco** | Nenhuma dependencia de banco em runtime detectada. | 0 chamadas. |
| **Cobertura de componentes** | Componentes-chave (sidebar, card, toggle, formulario, badge de status) presentes no Storybook. | 100% dos componentes-chave. |

### 10.3 Sinais de experiencia (qualitativos)

- O founder consegue, ao abrir o app, identificar o "estado atual" do negocio em segundos.
- Nenhuma necessidade de re-explicar o basico do negocio a um agente: "ler o arquivo e obter o contexto".
- Ausencia de tabelas; exibicao sempre em cards; sensacao de minimalismo e foco.

---

## 11. Riscos e Questoes em Aberto

| # | Risco / Questao | Encaminhamento |
|---|---|---|
| RQ-1 | Schema exato de frontmatter por entidade ainda nao fixado. | Definido no doc de modelo de dados; PRD garante apenas o contrato base (R-FM-02). |
| RQ-2 | Edicao concorrente founder x agente pode gerar sobrescrita. | R-EDIT-07 (deteccao de conflito) como P1; merge como P2. |
| RQ-3 | Como a UI "descobre" entidades faltantes vs fixas por secao. | MVP usa lista fixa de entidades por secao (secao 6) + descoberta de arquivos (R-CARD-08); estado "nao iniciado" e P1. |
| RQ-4 | Escrita de arquivo no ambiente Next.js (server action / rota) sem banco. | Detalhado no doc de arquitetura; PRD exige apenas o comportamento (R-EDIT-02) e zero-banco (O7). |
| RQ-5 | Aprovacao de mudancas de agente na UI — qual a superficie. | Especificado no doc de agentes; PRD fixa o principio (R-AG-04). |
| RQ-6 | Persistencia da preferencia grid/lista e outras prefs de UI. | P1/P2; nao bloqueia MVP. |

---

## 12. Dependencias a Jusante

Este PRD alimenta e precisa se manter consistente com:

- **Arquitetura & stack** — como as gravacoes de arquivo acontecem (server actions/rotas), estrutura de pastas, plano Supabase futuro.
- **Modelo de dados / especificacao de conteudo** — schema formal de frontmatter por entidade; formaliza os headings recomendados da secao 6.
- **Design system / UI** — sidebar, cards, toggle grid/lista, badges de status, tokens P&B, Inter, Storybook.
- **Especificacao de agentes & skills** — fluxo concreto de leitura/escrita e a superficie de revisao/aprovacao (R-AG-04).
- **Plano de QA / aceitacao** — traduz a secao 8 (criterios de aceitacao) em casos de teste executaveis.
