-- ============================================================================
-- BusinessOS — Migration inicial: persistencia multi-tenant + auth + storage
-- ADR 0001 (docs/decisions/0001-persistencia-supabase-multitenant.md)
--
-- Cria: profiles (1:1 auth.users, com role), content_entities (as 11 entidades
-- por usuario), RLS de isolamento por tenant, trigger de provisionamento de
-- profile no signup, e o bucket privado de anexos com suas policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles — espelha auth.users com papel (admin | member)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada usuario le e edita apenas o proprio profile. O INSERT e feito pelo
-- trigger (security definer), nunca pelo cliente.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Helper reutilizavel: o usuario logado e admin?
create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Provisionamento de profile no signup (auth.users -> profiles)
--    O founder entra como 'admin'; qualquer outro como 'member'.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case
      when new.email = 'ruanbraz@overlens.com.br' then 'admin'
      else 'member'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. content_entities — as entidades de conteudo, uma copia por usuario
--    Espelha o frontmatter (jsonb completo) + corpo. PK composta por tenant.
--    `revision` sai do frontmatter e vira coluna para o lock otimista
--    (UPDATE ... WHERE revision = base; 0 linhas => ConflictError).
-- ----------------------------------------------------------------------------
create table if not exists public.content_entities (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entity_id   text not null,                 -- '<section>/<entity>' (ex.: 'direcao/tese-de-valor')
  section     text not null,                 -- 'founder' | 'direcao' | 'validacao' | 'caixa'
  frontmatter jsonb not null,                -- frontmatter completo: core + campos por-tipo
  body        text not null default '',      -- Markdown apos o frontmatter
  revision    integer not null default 1,    -- espelha frontmatter.revision (lock otimista)
  created     timestamptz not null default now(),
  updated     timestamptz not null default now(),
  primary key (user_id, entity_id)
);

create index if not exists content_entities_user_section_idx
  on public.content_entities (user_id, section);

alter table public.content_entities enable row level security;

-- Isolamento por tenant: cada usuario so enxerga/edita as proprias linhas.
create policy "content_select_own"
  on public.content_entities for select
  using (auth.uid() = user_id);

create policy "content_insert_own"
  on public.content_entities for insert
  with check (auth.uid() = user_id);

create policy "content_update_own"
  on public.content_entities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_delete_own"
  on public.content_entities for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. Storage — bucket privado de anexos (ADR 0001 §7)
--    Convencao de caminho: '<user_id>/<...>' — o primeiro segmento e o dono.
--    Sem UI de upload ainda; a infra e as policies ficam prontas.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments_select_own"
  on storage.objects for select
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_update_own"
  on storage.objects for update
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 5. Hardening — funcoes SECURITY DEFINER nao devem ser RPC publicas.
--    handle_new_user() so roda pelo trigger (como owner); is_admin() so para o
--    proprio usuario logado. Evita os lints 0028/0029 do database-linter.
-- ----------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
