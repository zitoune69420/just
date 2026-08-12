-- Signalements : un titre annoncé au catalogue mais illisible chez le lecteur.
--
-- Le catalogue vient de TMDB, la lecture d'une source tierce : les deux ne
-- couvrent pas le même fonds. Rien côté application ne permet de savoir qu'un
-- titre est absent du lecteur — seul quelqu'un qui a essayé le sait.
--
-- La contrainte d'unicité porte sur l'épisode : signaler deux fois la même
-- chose ne change rien au constat, mais deux épisodes d'une même série sont
-- bien deux signalements distincts. Elle sert aussi de garde-fou contre le
-- bruit, en plus du quota côté application.
--
-- `coalesce` dans l'index : `unique` laisse passer les doublons dès qu'une
-- colonne est nulle, ce qui est le cas de `season` et `episode` pour un film.

create table if not exists public.reports (
  id bigint primary key generated always as identity,
  user_id uuid not null references public.users (id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  season integer,
  episode integer,
  reason text not null check (reason in ('unavailable', 'wrong-title', 'playback', 'subtitles')),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists reports_unique_target_idx
  on public.reports (
    user_id, tmdb_id, media_type,
    coalesce(season, -1), coalesce(episode, -1)
  );

-- Le tableau d'administration lit les signalements ouverts, du plus récent au
-- plus ancien.
create index if not exists reports_open_created_idx
  on public.reports (resolved, created_at desc);

-- Compte des signalements visant un même titre, pour les classer par urgence.
create index if not exists reports_target_idx
  on public.reports (tmdb_id, media_type);

alter table public.reports enable row level security;

revoke all on public.reports from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260812-180000')
on conflict (name) do nothing;
