-- Estúdio de Miolos · catálogo e histórico na nuvem
-- Rode UMA vez (depois do estudio-nuvem.sql): Supabase → SQL Editor → New query → cole tudo → Run.
-- Pode rodar de novo sem problema. Os arquivos (imagens, fontes) usam a pasta privada "estudio" já criada.

create table if not exists public.estudio_catalogo (
  user_id       uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  id            text   not null,
  tipo          text   not null default '',
  dados         jsonb  not null default '{}'::jsonb,
  arquivo       text,
  excluido      boolean not null default false,
  atualizado_em bigint  not null default 0,
  primary key (user_id, id)
);

alter table public.estudio_catalogo enable row level security;

drop policy if exists "estudio_catalogo: so o dono" on public.estudio_catalogo;
create policy "estudio_catalogo: so o dono" on public.estudio_catalogo
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
