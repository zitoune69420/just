create table if not exists public.schema_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);

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

create table if not exists public.progress (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  season integer,
  episode integer,
  position_seconds integer not null default 0,
  duration_seconds integer,
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

create index if not exists progress_user_updated_idx
  on public.progress (user_id, updated_at desc);

alter table public.users enable row level security;
alter table public.watchlist enable row level security;
alter table public.progress enable row level security;

revoke all on public.users from anon, authenticated;
revoke all on public.watchlist from anon, authenticated;
revoke all on public.progress from anon, authenticated;

create or replace function public.advance_progress(
  p_user_id uuid,
  p_tmdb_id integer,
  p_media_type text,
  p_season integer,
  p_episode integer,
  p_seconds integer,
  p_duration integer
) returns void
language plpgsql
as $$
begin
  insert into public.progress (
    user_id, tmdb_id, media_type, season, episode,
    position_seconds, duration_seconds, updated_at
  )
  values (
    p_user_id, p_tmdb_id, p_media_type, p_season, p_episode,
    greatest(p_seconds, 0), p_duration, now()
  )
  on conflict (user_id, tmdb_id, media_type) do update
  set position_seconds = case
        when progress.season is distinct from excluded.season
          or progress.episode is distinct from excluded.episode
        then excluded.position_seconds
        else progress.position_seconds + excluded.position_seconds
      end,
      season = excluded.season,
      episode = excluded.episode,
      duration_seconds = coalesce(excluded.duration_seconds, progress.duration_seconds),
      updated_at = now();
end;
$$;

revoke all on function public.advance_progress(
  uuid, integer, text, integer, integer, integer, integer
) from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260806-100000')
on conflict (name) do nothing;
