-- Distinguer une position réelle d'un simple temps cumulé.
--
-- `position_seconds` a porté deux choses successives. Avant `set_progress`,
-- c'était le temps pendant lequel la fenêtre était restée ouverte, additionné
-- séance après séance : une valeur qui peut dépasser la durée du titre. Depuis,
-- c'est la position rapportée par le lecteur.
--
-- Rien ne distinguait les deux, et les lignes écrites avant la bascule sont
-- toujours là. Les servir à `startAt` demande au lecteur de démarrer au-delà de
-- la fin du média : il attend alors un segment qui n'existe pas, et tourne sans
-- jamais démarrer.
--
-- Le drapeau tranche. Il est faux par défaut, donc les anciennes lignes ne sont
-- jamais reprises ; la première lecture réelle du titre le passe à vrai et la
-- reprise redevient disponible, sans migration de données ni perte d'historique.

alter table public.progress
  add column if not exists position_exact boolean not null default false;

create or replace function public.set_progress(
  p_user_id uuid,
  p_tmdb_id integer,
  p_media_type text,
  p_season integer,
  p_episode integer,
  p_position integer,
  p_duration integer
) returns void
language plpgsql
as $$
begin
  insert into public.progress (
    user_id, tmdb_id, media_type, season, episode,
    position_seconds, duration_seconds, position_exact, updated_at
  )
  values (
    p_user_id, p_tmdb_id, p_media_type, p_season, p_episode,
    greatest(p_position, 0), p_duration, true, now()
  )
  on conflict (user_id, tmdb_id, media_type) do update
  set position_seconds = greatest(excluded.position_seconds, 0),
      season = excluded.season,
      episode = excluded.episode,
      duration_seconds = coalesce(excluded.duration_seconds, progress.duration_seconds),
      position_exact = true,
      updated_at = now();
end;
$$;

-- Le repli continue d'additionner, et ce qu'il écrit reste inapte à la reprise.
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
    position_seconds, duration_seconds, position_exact, updated_at
  )
  values (
    p_user_id, p_tmdb_id, p_media_type, p_season, p_episode,
    greatest(p_seconds, 0), p_duration, false, now()
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
      -- Un changement d'épisode repart d'un compteur cumulé, donc inexact.
      position_exact = case
        when progress.season is distinct from excluded.season
          or progress.episode is distinct from excluded.episode
        then false
        else progress.position_exact
      end,
      updated_at = now();
end;
$$;

revoke all on function public.set_progress(
  uuid, integer, text, integer, integer, integer, integer
) from anon, authenticated;

revoke all on function public.advance_progress(
  uuid, integer, text, integer, integer, integer, integer
) from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260812-193000')
on conflict (name) do nothing;
