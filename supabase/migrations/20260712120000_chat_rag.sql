-- Chat da pagina Principal + base de conhecimento RAG (pgvector).
-- Segue o mesmo padrao multi-tenant da migration inicial: cada tabela tem
-- user_id uuid not null default auth.uid(), RLS habilitada e 4 policies
-- auth.uid() = user_id (ver docs/decisions/0001).

-- ---------------------------------------------------------------------------
-- Extensao vector (pgvector) para embeddings do RAG.
-- ---------------------------------------------------------------------------
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Bloco 1 — conversas do chat
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title   text not null default 'Nova conversa',
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);
create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated desc);

alter table public.conversations enable row level security;

create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Bloco 2 — mensagens
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created         timestamptz not null default now()
);
create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created);

alter table public.messages enable row level security;

create policy "messages_select_own" on public.messages
  for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "messages_update_own" on public.messages
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Bloco 3 — base de conhecimento (chunks com embedding)
-- source_type: 'entity' (source_id = '<section>/<entity>') ou 'message' (source_id = uuid da message)
-- ---------------------------------------------------------------------------
create table if not exists public.knowledge_chunks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_type text not null check (source_type in ('entity', 'message')),
  source_id   text not null,
  chunk_index integer not null default 0,
  content     text not null,
  embedding   vector(1536),
  created     timestamptz not null default now(),
  updated     timestamptz not null default now(),
  unique (user_id, source_type, source_id, chunk_index)
);
create index if not exists knowledge_chunks_user_source_idx
  on public.knowledge_chunks (user_id, source_type, source_id);
-- Indice ANN (cosseno) para busca por similaridade.
create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

alter table public.knowledge_chunks enable row level security;

create policy "knowledge_select_own" on public.knowledge_chunks
  for select using (auth.uid() = user_id);
create policy "knowledge_insert_own" on public.knowledge_chunks
  for insert with check (auth.uid() = user_id);
create policy "knowledge_update_own" on public.knowledge_chunks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "knowledge_delete_own" on public.knowledge_chunks
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Bloco 4 — RPC de busca por similaridade.
-- SECURITY INVOKER (default): a RLS de knowledge_chunks aplica, entao a funcao
-- so enxerga os chunks do caller (auth.uid()). Nenhum filtro extra necessario.
-- ---------------------------------------------------------------------------
create or replace function public.match_knowledge (
  query_embedding vector(1536),
  match_count integer default 6
)
returns table (
  id          uuid,
  source_type text,
  source_id   text,
  content     text,
  similarity  double precision
)
language sql
stable
as $$
  select
    kc.id,
    kc.source_type,
    kc.source_id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.embedding is not null
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;
