drop table if exists public.watchlist cascade;
drop table if exists public.profiles cascade;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  password_hash text,
  name text not null,
  avatar text,
  discord_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlist (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  added_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

create index if not exists watchlist_user_added_idx
  on public.watchlist (user_id, added_at desc);

alter table public.users enable row level security;
alter table public.watchlist enable row level security;

revoke all on public.users from anon, authenticated;
revoke all on public.watchlist from anon, authenticated;
