-- Estúdio de Miolos · cópia dos projetos na nuvem
-- Rode UMA vez: Supabase → SQL Editor → New query → cole tudo → Run.
-- Pode rodar de novo sem problema.

-- 1) Lista de projetos de cada pessoa
create table if not exists public.estudio_projetos (
  user_id      uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  id           text   not null,
  nome         text   not null default '',
  paginas      int    not null default 0,
  tamanhos     text   not null default '',
  versao       bigint not null default 0,
  criado_em    bigint not null default 0,
  excluido_em  bigint,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.estudio_projetos enable row level security;

drop policy if exists "estudio_projetos: so o dono" on public.estudio_projetos;
create policy "estudio_projetos: so o dono" on public.estudio_projetos
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 2) Pasta privada para os arquivos (projetos, imagens, fontes)
insert into storage.buckets (id, name, public)
values ('estudio', 'estudio', false)
on conflict (id) do nothing;

drop policy if exists "estudio: so o dono" on storage.objects;
create policy "estudio: so o dono" on storage.objects
  for all to authenticated
  using (bucket_id = 'estudio' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'estudio' and (storage.foldername(name))[1] = auth.uid()::text);
