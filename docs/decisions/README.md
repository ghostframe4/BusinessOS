# Architecture Decision Records (ADRs)

Esta pasta guarda as **decisões de arquitetura** do BusinessOS — o *porquê* por trás
das mudanças estruturais, não o *como* (isso vive em `docs/04-technical-spec.md` e no
código).

## Convenção

- Um arquivo por decisão: `NNNN-titulo-em-kebab-case.md` (numeração sequencial).
- Estrutura: **Contexto → Decisão → Consequências → Alternativas consideradas**.
- Status possíveis: `proposto` · `aceito` · `substituído por NNNN` · `revogado`.
- Uma vez `aceito`, um ADR é imutável; para mudar de rumo, escreva um novo ADR que o
  substitua (e marque o antigo como `substituído por`).

## Índice

| # | Título | Status |
|---|--------|--------|
| [0001](0001-persistencia-supabase-multitenant.md) | Persistência em Supabase + multiusuário (fim do Markdown como fonte) | aceito |
