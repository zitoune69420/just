-- Position de lecture réelle, rapportée par le lecteur.
--
-- `advance_progress` ne connaissait pas la position : il additionnait le temps
-- pendant lequel la fenêtre de lecture était restée ouverte. C'était une
-- approximation acceptable faute de mieux, mais elle dérive dès qu'on met en
-- pause, qu'on se déplace dans la vidéo ou qu'on la revoit — et elle peut
-- dépasser la durée du titre.
--
-- Le lecteur émet sa position par `postMessage`. Quand on la connaît, elle
-- remplace la valeur stockée au lieu de s'y ajouter. `advance_progress` reste en
-- place : il sert encore de repli quand aucun événement n'arrive.

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
    position_seconds, duration_seconds, updated_at
  )
  values (
    p_user_id, p_tmdb_id, p_media_type, p_season, p_episode,
    greatest(p_position, 0), p_duration, now()
  )
  on conflict (user_id, tmdb_id, media_type) do update
  set position_seconds = greatest(excluded.position_seconds, 0),
      season = excluded.season,
      episode = excluded.episode,
      duration_seconds = coalesce(excluded.duration_seconds, progress.duration_seconds),
      updated_at = now();
end;
$$;

revoke all on function public.set_progress(
  uuid, integer, text, integer, integer, integer, integer
) from anon, authenticated;

insert into public.schema_migrations (name)
values ('migration-20260812-170000')
on conflict (name) do nothing;
