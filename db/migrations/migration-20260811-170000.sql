-- Suivi de personnes : acteurs et réalisateurs qu'un compte veut garder à
-- l'œil. Sert à alimenter la rangée « nouveautés de vos personnes suivies ».
--
-- L'identifiant est celui de TMDB, comme partout ailleurs : pas de table
-- locale des personnes à tenir à jour.

create table if not exists public.person_follows (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users (id) on delete cascade,
  person_id integer not null,
  added_at timestamptz not null default now(),
  unique (user_id, person_id)
);

create index if not exists person_follows_user_added_idx
  on public.person_follows (user_id, added_at desc);

alter table public.person_follows enable row level security;

revoke all on public.person_follows from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260811-170000')
on conflict (name) do nothing;
