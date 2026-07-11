---
doc: briefing
title: Briefing do BusinessOS
status: canonico
versao: 1.0.0
owner: ruanbraz@overlens.com.br
atualizado_em: 2026-07-11
tags: [visao, escopo, fonte-da-verdade, contexto, multi-agente]
---

# BusinessOS — Briefing do Projeto

> **Fonte canonica da verdade.** Este documento e a base sobre a qual todos os demais docs (`docs/01+`) sao construidos. Em caso de conflito entre documentos, este prevalece ate ser explicitamente revisado. Decisoes de stack aqui listadas sao *defaults* e nao devem ser re-litigadas sem motivo forte.

---

## 1. Visao & Problema

### O problema
Quem comeca um negocio do zero nao sofre por falta de ferramentas — sofre por **fragmentacao de contexto**. As decisoes que definem o negocio (quem e o cliente, qual o problema, qual a oferta, como entra dinheiro) vivem espalhadas em cabecas, planilhas, notas soltas, threads de chat e slides. O resultado:

- O founder retoma o trabalho todo dia sem um "estado atual" claro do negocio.
- Nao existe uma superficie unica onde a inteligencia do negocio se acumule e evolua.
- Ferramentas de IA ajudam em tarefas pontuais, mas nao compartilham um contexto persistente e estruturado — cada conversa comeca do zero.

### A visao
O **BusinessOS** e um *sistema operacional de tomada de decisao* para o founder que esta comecando do zero. Ele e, ao mesmo tempo:

1. **Um web app** onde o founder edita as informacoes do negocio por formularios, secao por secao.
2. **A inteligencia viva do negocio** — cada informacao editada e persistida como um arquivo Markdown com frontmatter YAML, e esses mesmos arquivos formam a **camada de contexto compartilhado** que agentes de IA e skills leem e escrevem para colaborar no desenvolvimento do negocio.

A tese central: **o mesmo artefato serve humano e maquina.** O founder ve cards e formularios; os agentes veem MD estruturado. Um so lugar, uma so verdade.

---

## 2. Usuario-Alvo

**O founder comecando do zero** ("Pra quem esta comecando do zero").

Caracteristicas do publico:

- Esta nas primeiras etapas — do estagio de ideia ate os primeiros clientes.
- Toma multiplas decisoes de negocio sozinho ou em time muito pequeno.
- Nao quer preencher burocracia; quer **clareza** e **progresso**.
- Valoriza minimalismo, foco e um fluxo que reflita como se constroi um negocio de verdade (direcao antes de validacao, validacao antes de escala).
- Trabalha lado a lado com IA e espera que a IA conheca o contexto do negocio sem precisar ser re-explicado a cada interacao.

**Nao e** para: empresas ja estruturadas com departamentos, times de dados dedicados, ou quem busca um ERP/CRM completo.

---

## 3. Proposta de Valor

- **Um lugar so para a verdade do negocio.** O estado atual do negocio deixa de estar na cabeca do founder e passa a ser um artefato consultavel e editavel.
- **Contexto que agentes entendem.** Como tudo e MD + frontmatter, a IA opera sobre a mesma verdade que o humano — sem copiar-e-colar contexto, sem alucinar o basico.
- **Sequencia que espelha a construcao real do negocio.** As secoes guiam o founder de `founder` -> `direcao` -> `validacao` -> `caixa`.
- **Propriedade dos dados.** Conteudo em arquivos locais legiveis por humanos (`content/`), versionaveis, sem lock-in. Nao exige banco para comecar.
- **Colaboracao humano+IA de primeira classe.** Skills e agentes sao cidadaos do produto, nao um plugin lateral.

---

## 4. Escopo do Produto — O que o BusinessOS e/faz

### E
- Um web app Next.js (App Router) que renderiza **secoes** na sidebar; cada secao abre uma **pagina de cards**.
- Cada **card** representa uma **entidade** do negocio, persistida como **um arquivo Markdown** em `content/<secao>/<entidade>.md`.
- Formularios na UI para **criar e editar** o conteudo de cada entidade; ao salvar, o app escreve o MD (corpo + frontmatter).
- Toggle de **visualizacao grid/lista** (um unico controle select) nas paginas de cards.
- A **camada de contexto compartilhado** para agentes de IA e skills, que leem/escrevem os mesmos arquivos.

### Nao e (nesta fase)
- Nao tem banco de dados conectado. Persistencia = arquivos MD locais em `content/`.
- Nao usa tabelas para exibir dados — usa cards.
- Nao e um ERP/CRM completo (a entidade `erp` existe como *documento de contexto*, nao como modulo transacional).
- Nao implementa Supabase agora — Supabase e citado como **camada de persistencia FUTURA** (ver docs de arquitetura; documentar, nao implementar).

### Modelo mental
```
Secao (item da sidebar)  ->  Pagina de cards
   Entidade (card)       ->  1 documento Markdown  ->  content/<secao>/<entidade>.md
      frontmatter (YAML) ->  metadados estruturados (lidos por humano e por agente)
      corpo (Markdown)   ->  conteudo narrativo/estruturado da entidade
```

---

## 5. As 4 Secoes e o Proposito de Cada

Cada secao = **1 item de sidebar + 1 pagina de cards**. Cada entidade = **1 documento MD = 1 card**.

### 5.1 `founder`
*Quem esta construindo e por que.* Ancora todas as decisoes ao ser humano por tras do negocio.
- **objetivo** — o que o founder quer alcancar com este negocio.
- **estilo-de-vida** — a vida que o negocio precisa sustentar (restricoes e aspiracoes de tempo, renda, liberdade).

### 5.2 `direcao`
*Para onde o negocio aponta.* Define mercado, problema, cliente e oferta em nivel de tese.
- **mapa-do-mercado** — o territorio onde o negocio joga.
- **ima-de-problemas** — os problemas que atraem o founder / que valem ser resolvidos.
- **perfil-ideal-de-cliente** — o ICP: para quem exatamente.
- **tese-de-valor** — por que esse cliente pagaria; a hipotese de valor.
- **oferta** — a oferta como intencao estrategica (versao "direcao").

### 5.3 `validacao`
*O que ja foi testado com a realidade.* Confronta as teses com o mundo.
- **oferta** — a oferta como ela e testada/refinada em campo (versao "validacao"; arquivo distinto da `oferta` de `direcao`).
- **primeiros-clientes** — os primeiros clientes reais e o aprendizado extraido deles.

### 5.4 `caixa`
*Como o dinheiro entra e se move.* Traz a realidade financeira para o mesmo contexto.
- **fluxo-de-caixa** — entradas e saidas ao longo do tempo.
- **erp** — documento de contexto sobre operacao/registro financeiro do negocio (contexto, nao modulo transacional).

> **Nota sobre `oferta` duplicada:** `oferta` aparece em `direcao` **e** em `validacao`. Sao **arquivos distintos por secao** (`content/direcao/oferta.md` e `content/validacao/oferta.md`), representando a oferta como *tese* versus a oferta como *evidencia validada*.

---

## 6. Estrategia de Contexto via MD + Frontmatter

Gerenciar contexto via **Markdown + frontmatter** e um **objetivo de produto de primeira classe**, nao um detalhe de implementacao.

### Principios
1. **Um arquivo por entidade.** Cada card mapeia 1:1 para `content/<secao>/<entidade>.md`. Sem multiplexacao.
2. **Frontmatter YAML = metadados estruturados.** Campos legiveis por maquina no topo do arquivo (entre `---`), consumidos tanto pela UI (para renderizar cards/formularios) quanto por agentes (para raciocinar sobre o negocio).
3. **Corpo Markdown = conteudo.** A narrativa e os detalhes ricos ficam no corpo, com headings claros.
4. **Legivel por humano e por maquina simultaneamente.** O mesmo arquivo abre num editor de texto, num diff de git, na UI e num prompt de agente.
5. **Fonte unica.** Nao ha copia paralela do estado em outro formato. A UI e um *editor* dos arquivos, nao um espelho de outro banco.

### Formato-alvo (convencao, detalhada nos docs de dados)
```markdown
---
secao: direcao
entidade: tese-de-valor
titulo: "Tese de valor"
status: rascunho        # rascunho | em-progresso | validado
atualizado_em: 2026-07-11
tags: [valor, hipotese]
---

# Tese de valor

## Hipotese
...

## Evidencias
...
```

> O **schema exato do frontmatter por entidade** e definido nos docs subsequentes (modelo de dados / especificacao de conteudo). Este briefing estabelece apenas o principio: **MD + frontmatter como contrato de contexto**.

---

## 7. Colaboracao Multi-Agente / Skills

O BusinessOS trata **agentes de IA e skills como colaboradores de primeira classe** do founder no desenvolvimento do negocio.

### Como funciona conceitualmente
- Os arquivos MD em `content/` sao o **contexto compartilhado** — o "quadro branco" comum entre o founder e os agentes.
- **Agentes leem** os MD para entender o estado atual do negocio antes de agir (ex.: um agente de "direcao" le `mapa-do-mercado` e `perfil-ideal-de-cliente` para propor uma `tese-de-valor`).
- **Agentes escrevem** de volta nos MD (ex.: preencher um rascunho de `oferta`, atualizar `primeiros-clientes` com aprendizados), respeitando o mesmo formato que a UI usa.
- **Skills** encapsulam capacidades reutilizaveis (ex.: "gerar mapa do mercado", "auditar oferta", "sintetizar aprendizado dos primeiros clientes") operando sobre o mesmo substrato de arquivos.
- O founder permanece no controle: a UI e onde ele revisa, edita e aprova o que agentes propoem — humano e IA editam **os mesmos arquivos**, cada um pela superficie apropriada.

### Por que MD viabiliza isso
Porque o contexto ja e estruturado (frontmatter) e legivel (Markdown), um agente nao precisa de uma API proprietaria nem de engenharia de contexto ad-hoc: **ler o arquivo e obter o contexto.** Isso torna a colaboracao multi-agente barata, transparente e auditavel (via diffs).

---

## 8. Resumo da Stack (defaults — nao re-litigar)

| Camada | Escolha |
|---|---|
| Framework | **Next.js (App Router)** + **TypeScript**, web app classico |
| Estilo | **Tailwind CSS** + **shadcn/ui** |
| Componentes | **Storybook** para gestao de componentes |
| Fonte | **Inter** |
| Design | Minimalista **preto & branco**, cantos arredondados, itens de sidebar com **hover background** |
| Exibicao de dados | **Cards** (nao tabelas), com toggle **grid/lista** (um controle select) |
| Persistencia (agora) | Arquivos **Markdown locais** em `content/` |
| Persistencia (futuro) | **Supabase** — apenas documentar, **nao implementar** |

Idioma do produto e da documentacao: **portugues do Brasil** (termos tecnicos e identificadores permanecem em ingles).

---

## 9. Nao-Objetivos (nesta fase)

- **Sem banco de dados conectado.** Nada de Postgres/Supabase rodando; persistencia e em arquivo.
- **Sem autenticacao / multiusuario.** Produto e single-founder local por ora.
- **Sem tabelas** como padrao de exibicao — cards sempre.
- **Sem ERP/CRM transacional.** `erp` e `fluxo-de-caixa` sao documentos de contexto, nao modulos com lancamentos operacionais.
- **Sem execucao autonoma sem revisao.** Agentes propoem; o founder aprova via UI.
- **Sem escalar a stack alem dos defaults.** Nada de bibliotecas de estado pesadas, GraphQL, microservicos, etc.
- **Sem internacionalizacao** — pt-BR unico por enquanto.

---

## 10. Criterios de Sucesso

O BusinessOS esta cumprindo sua visao quando:

1. **Ida e volta completa em arquivo.** O founder edita uma entidade num formulario, salva, e o arquivo `content/<secao>/<entidade>.md` correspondente e criado/atualizado com frontmatter + corpo corretos — e reabrir a UI reflete fielmente o arquivo.
2. **As 4 secoes navegaveis.** Sidebar com `founder`, `direcao`, `validacao`, `caixa`; cada uma abre sua pagina de cards com as entidades certas.
3. **Cards com toggle grid/lista** funcionando via um unico controle select.
4. **Contrato de contexto legivel.** Um agente (ou um humano no editor) consegue abrir qualquer MD e entender o estado da entidade sem contexto adicional — frontmatter valido e headings claros.
5. **Colaboracao demonstravel.** Um agente/skill consegue ler um MD de contexto e escrever de volta uma atualizacao valida que a UI renderiza sem quebrar.
6. **Fidelidade ao design.** Minimalista P&B, Inter, cantos arredondados, hover na sidebar — consistente e componentizado (Storybook).
7. **Zero dependencia de banco.** Tudo funciona apenas com o filesystem local; Supabase permanece documentado como futuro, nao requerido.

---

## 11. Glossario

| Termo | Definicao |
|---|---|
| **BusinessOS** | O produto: web app + base de conhecimento viva para o founder tomar decisoes e construir o negocio. |
| **Founder** | Usuario-alvo unico; quem esta construindo o negocio do zero. |
| **Secao** | Agrupamento tematico de alto nivel; 1 item de sidebar + 1 pagina de cards. As quatro: `founder`, `direcao`, `validacao`, `caixa`. |
| **Entidade** | Uma unidade de informacao do negocio dentro de uma secao; corresponde a 1 documento MD e a 1 card. |
| **Card** | Representacao visual de uma entidade na pagina da secao (exibicao em cards, nunca tabela). |
| **Documento MD** | Arquivo Markdown (`content/<secao>/<entidade>.md`) que persiste uma entidade; unidade atomica de persistencia. |
| **Frontmatter** | Bloco YAML no topo de um arquivo MD (entre `---`) com metadados estruturados, legiveis por humano e por maquina. |
| **Camada de contexto** | O conjunto de arquivos MD em `content/` visto como o contexto compartilhado entre founder e agentes. |
| **Agente** | Processo de IA que le/escreve os MD para colaborar no desenvolvimento do negocio. |
| **Skill** | Capacidade reutilizavel invocavel que opera sobre o substrato de arquivos MD (ex.: gerar/auditar/sintetizar uma entidade). |
| **content/** | Diretorio raiz onde os arquivos MD do negocio sao persistidos localmente. |
| **Toggle grid/lista** | Controle select unico que alterna a exibicao dos cards entre grade e lista. |
| **Supabase (futuro)** | Camada de persistencia planejada para o futuro; documentada, nao implementada nesta fase. |
| **ICP** | Ideal Customer Profile — o perfil ideal de cliente (entidade `perfil-ideal-de-cliente`). |
| **Oferta (direcao vs validacao)** | Entidade que existe em duas secoes como arquivos distintos: `direcao/oferta.md` (tese) e `validacao/oferta.md` (evidencia validada). |

---

## 12. Dependencias a Jusante

Este briefing e a fundacao para os proximos documentos, que devem se manter consistentes com ele:

- **Arquitetura & stack** — detalha Next.js App Router, estrutura de pastas, e o plano de persistencia (arquivo agora, Supabase futuro).
- **Modelo de dados / especificacao de conteudo** — define o schema de frontmatter por entidade e o layout de `content/`.
- **Design system / UI** — sidebar, paginas de cards, toggle grid/lista, tokens P&B, Inter, Storybook.
- **Especificacao de agentes & skills** — como agentes leem/escrevem os MD e o fluxo de revisao/aprovacao pelo founder.
