alter table public.users
  add column if not exists role text not null default 'user';

alter table public.users
  drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in ('user', 'gold', 'platinum', 'admin'));

create table if not exists public.grants (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  period text not null default '',
  granted_at timestamptz not null default now(),
  unique (user_id, media_type, tmdb_id, period)
);

create index if not exists grants_user_period_idx
  on public.grants (user_id, media_type, period);

alter table public.grants enable row level security;

revoke all on public.grants from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260806-101500')
on conflict (name) do nothing;
